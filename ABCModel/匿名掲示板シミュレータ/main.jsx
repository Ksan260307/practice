import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

// Ambient globals
const apiKey = ""; // The environment provides the key at runtime
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const VIEWS = {
  BOARD: 'board',
  THREAD: 'thread',
  MAINTENANCE: 'maintenance',
} as const;

type View = (typeof VIEWS)[keyof typeof VIEWS];

type DynParams = {
  vA: number;
  vB: number;
  vC: number;
  vE3: number;
};

type ThreadDoc = {
  id: string;
  title: string;
  postCount: number;
  updatedAt?: Timestamp | null;
};

type PostDoc = {
  id: string;
  number: number;
  name: string;
  uid: string;
  content: string;
  createdAt?: Timestamp | null;
};

type StatusKind = 'info' | 'error' | 'success';

type StatusState = {
  message: string;
  kind: StatusKind;
};

const DEFAULT_DYN_PARAMS: DynParams = {
  vA: 1,
  vB: 1,
  vC: 1,
  vE3: 0,
};

const THREADS_COLLECTION_PATH = ['artifacts', appId, 'public', 'data', 'threads'] as const;

const dayMap = ['日', '月', '火', '水', '木', '金', '土'];

function formatDisplayDate(value?: Timestamp | null): string {
  if (!value) return '----/--/--(-- ) --:--:--.--';
  const date = value.toDate();
  const d = dayMap[date.getDay()];
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}(${d}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0').slice(0, 2)}`;
}

function generateUserId(uid: string, threadId: string): string {
  let hash = 0;
  const str = `${uid}${threadId}core_v401_fix`;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8).toUpperCase();
}

function sanitizeAiReply(text: string): string {
  return text
    .replace(/^\d+[:：]\s*/, '')
    .replace(/^名前[：:].*?\n/, '')
    .trim();
}

function parsePostName(rawName: string): { isSage: boolean; displayName: string } {
  const trimmed = rawName.trim();
  const isSage = /^sage$/i.test(trimmed);
  if (trimmed === '' || isSage) {
    return { isSage, displayName: '名無しさん' };
  }
  return { isSage: false, displayName: trimmed };
}

class ThreadDynamicsEngine {
  constructor(private readonly params: DynParams) {}

  calculate() {
    const { vA, vB, vC, vE3 } = this.params;
    const clamp = (value: number) => Math.max(0, Math.min(2, value));
    const curA = clamp(vA - vC * 0.4);
    const curB = clamp(vB + vE3 * 0.3);
    const curC = clamp(vC + vB * 0.2);
    const ruinScore = Math.min(6, Math.max(curA, curB, curC) * 2);
    return { curA, curB, curC, ruinScore };
  }

  getSystemPrompt(): string {
    const s = this.calculate();
    const tone = s.curB > 1.2 ? '攻撃的' : s.curC > 1.2 ? '冷笑的' : '標準的';
    return `あなたは日本の匿名掲示板の住人です。
【ルール】
1. 本文のみ。ヘッダーや「名前：」などは不要。
2. 50-150文字程度。
3. 文末は「。」「！」「ｗ」「…」等で完結。
4. 属性: ${tone}。安価（>>[番号]）を稀に使ってもよい。`;
  }
}

/**
 * Call Gemini API directly with exponential backoff.
 */
async function fetchGeminiWithRetry(prompt: string, systemPrompt: string, retries = 5): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.9, maxOutputTokens: 3000 }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
      
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
  }
  return '';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<View>(VIEWS.BOARD);
  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [status, setStatus] = useState<StatusState>({ message: '', kind: 'info' });
  const [isAutoPosting, setIsAutoPosting] = useState(false);

  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostName, setNewPostName] = useState('');
  const [dynParams, setDynParams] = useState<DynParams>(DEFAULT_DYN_PARAMS);

  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const processingRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({
    posts,
    isAutoPosting,
    currentThreadId,
    dynParams,
    threads,
    user,
  });

  useEffect(() => {
    stateRef.current = {
      posts,
      isAutoPosting,
      currentThreadId,
      dynParams,
      threads,
      user,
    };
  }, [posts, isAutoPosting, currentThreadId, dynParams, threads, user]);

  const setTransientStatus = useCallback((message: string, kind: StatusKind = 'info', duration = 3000) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatus({ message, kind });
    if (duration > 0) {
      statusTimerRef.current = setTimeout(() => {
        setStatus({ message: '', kind: 'info' });
        statusTimerRef.current = null;
      }, duration);
    }
  }, []);

  const performScroll = useCallback((instant = false) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    });
  }, []);

  useLayoutEffect(() => {
    if (currentView === VIEWS.THREAD) {
      performScroll(true);
    }
  }, [currentView, currentThreadId, performScroll]);

  useEffect(() => {
    if (posts.length === 0) return;
    const timer = setTimeout(() => performScroll(), 60);
    return () => clearTimeout(timer);
  }, [posts.length, performScroll]);

  // Auth initialization
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth Fail', error);
        if (mounted) {
          setTransientStatus('認証失敗', 'error', 5000);
          setAuthReady(true);
        }
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!mounted) return;
      setUser(nextUser);
      setAuthReady(true);
    });
    void initAuth();
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setTransientStatus]);

  // Sync Threads
  useEffect(() => {
    if (!authReady || !user) return;
    const threadsCollection = collection(db, ...THREADS_COLLECTION_PATH);
    return onSnapshot(
      threadsCollection,
      (snapshot) => {
        const nextThreads: ThreadDoc[] = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<ThreadDoc, 'id'>),
          }))
          .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
        setThreads(nextThreads);
      },
      (error) => {
        console.error('Thread Sync Error', error);
        setTransientStatus('データ取得エラー', 'error');
      },
    );
  }, [authReady, user, setTransientStatus]);

  // Sync Posts
  useEffect(() => {
    if (!authReady || !user || !currentThreadId) {
      setPosts([]);
      return;
    }
    const postsCollection = collection(db, 'artifacts', appId, 'public', 'data', `posts_${currentThreadId}`);
    return onSnapshot(
      postsCollection,
      (snapshot) => {
        const nextPosts: PostDoc[] = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<PostDoc, 'id'>),
          }))
          .sort((a, b) => a.number - b.number);
        setPosts(nextPosts);
      },
      (error) => {
        console.error('Post Sync Error', error);
        setTransientStatus('レス取得エラー', 'error');
      },
    );
  }, [authReady, user, currentThreadId, setTransientStatus]);

  const createPost = useCallback(
    async (threadId: string, rawName: string, rawContent: string): Promise<boolean> => {
      const latestUser = stateRef.current.user;
      const content = rawContent.trim();
      if (!threadId || !latestUser || !content) return false;

      const threadRef = doc(db, ...THREADS_COLLECTION_PATH, threadId);
      const postsCollection = collection(db, 'artifacts', appId, 'public', 'data', `posts_${threadId}`);
      const { isSage, displayName } = parsePostName(rawName);

      try {
        await runTransaction(db, async (transaction) => {
          const threadSnapshot = await transaction.get(threadRef);
          if (!threadSnapshot.exists()) throw new Error('Thread missing');

          const postCount = (threadSnapshot.data().postCount as number | undefined) ?? 0;
          const nextNumber = postCount + 1;
          const postRef = doc(postsCollection);
          const now = serverTimestamp();
          const currentUpdatedAt = threadSnapshot.data().updatedAt ?? null;

          transaction.set(postRef, {
            number: nextNumber,
            name: displayName,
            uid: generateUserId(latestUser.uid, threadId),
            content,
            createdAt: now,
          });

          transaction.update(threadRef, {
            postCount: nextNumber,
            updatedAt: isSage ? currentUpdatedAt : now,
          });
        });
        return true;
      } catch (error) {
        console.error('Post Error:', error);
        const message = error instanceof Error ? error.message : 'unknown';
        setTransientStatus(`投稿失敗: ${message.slice(0, 24)}`, 'error', 5000);
        return false;
      }
    },
    [setTransientStatus],
  );

  const createThreadWithInitialPost = useCallback(async () => {
    const latestUser = stateRef.current.user;
    const title = newThreadTitle.trim();
    const initialContent = newThreadBody.trim() || 'スレ立て。';
    if (!latestUser || !title || isCreatingThread) return;

    setIsCreatingThread(true);
    const threadsCollection = collection(db, ...THREADS_COLLECTION_PATH);
    const threadRef = doc(threadsCollection);
    const postsCollection = collection(db, 'artifacts', appId, 'public', 'data', `posts_${threadRef.id}`);
    const postRef = doc(postsCollection);

    try {
      await runTransaction(db, async (transaction) => {
        const now = serverTimestamp();
        transaction.set(threadRef, { title, postCount: 1, updatedAt: now });
        transaction.set(postRef, {
          number: 1,
          name: '名無しさん',
          uid: generateUserId(latestUser.uid, threadRef.id),
          content: initialContent,
          createdAt: now,
        });
      });
      setNewThreadTitle('');
      setNewThreadBody('');
      setCurrentThreadId(threadRef.id);
      setCurrentView(VIEWS.THREAD);
      setIsAutoPosting(true);
      setTransientStatus('スレッド作成完了', 'success');
    } catch (error) {
      console.error('Create Thread Error:', error);
      setTransientStatus('スレッド作成失敗', 'error', 5000);
    } finally {
      setIsCreatingThread(false);
    }
  }, [isCreatingThread, newThreadBody, newThreadTitle, setTransientStatus]);

  const triggerAI = useCallback(async () => {
    const { isAutoPosting: shouldAutoPost, currentThreadId: threadId, posts: latestPosts, dynParams: latestDyn, threads: latestThreads } = stateRef.current;
    if (!shouldAutoPost || !threadId || processingRef.current || latestPosts.length === 0) return;

    const currentThread = latestThreads.find((item) => item.id === threadId);
    if (!currentThread) return;

    processingRef.current = true;
    setTransientStatus('AI思考中...', 'info', 0);

    try {
      const engine = new ThreadDynamicsEngine(latestDyn);
      const prompt = `スレタイ: ${currentThread.title}\n直近のレス:\n${latestPosts.slice(-5).map(p => `${p.number}: ${p.content}`).join('\n')}\n\n次を書き込め。`;
      
      const rawText = await fetchGeminiWithRetry(prompt, engine.getSystemPrompt());
      const text = sanitizeAiReply(rawText);

      if (!text) throw new Error('empty-ai-response');

      const ok = await createPost(threadId, '名無しさん', text);
      if (ok) {
        setTransientStatus('AI投稿完了', 'success');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setTransientStatus('AIエラー', 'error', 5000);
    } finally {
      processingRef.current = false;
    }
  }, [createPost, setTransientStatus]);

  // AI loop
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (delay: number) => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (stateRef.current.isAutoPosting) await triggerAI();
        if (!cancelled) schedule(12000 + Math.random() * 8000);
      }, delay);
    };
    schedule(15000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [triggerAI]);

  const currentThreadTitle = useMemo(
    () => threads.find((thread) => thread.id === currentThreadId)?.title ?? '',
    [threads, currentThreadId],
  );

  const statusClassName =
    status.kind === 'error'
      ? 'text-red-600 border-red-300'
      : status.kind === 'success'
        ? 'text-green-700 border-green-300'
        : 'text-blue-700 border-blue-300';

  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f0f0f0] font-mono text-gray-500">
        INITIALIZING_AUTH...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f0f0f0] text-gray-700 gap-4 p-6">
        <div className="text-lg font-bold">認証に失敗しました</div>
        <button onClick={() => window.location.reload()} className="bg-white border border-gray-400 px-4 py-2 text-sm hover:bg-gray-100">再読み込み</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f0f0] text-gray-900 font-sans overflow-hidden">
      <header className="bg-[#ccffcc] border-b border-gray-400 p-2 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <div className="font-bold text-blue-800 cursor-pointer text-sm flex items-center gap-1" onClick={() => setCurrentView(VIEWS.BOARD)}>
          <span className="bg-blue-800 text-white px-1 text-[10px] rounded-sm">掲</span>
          匿名掲示板シミュレータ v4.0.1
        </div>
        <div className="flex gap-2 items-center text-[10px]">
          {status.message && (
            <span className={`font-bold px-2 py-0.5 bg-white border rounded-sm shadow-sm ${statusClassName}`}>
              {status.message}
            </span>
          )}
          <button onClick={() => setCurrentView(VIEWS.MAINTENANCE)} className="bg-white border border-gray-400 px-2 py-0.5 hover:bg-gray-100">設定</button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto bg-[#efefef] md:bg-[#f0f0f0]" ref={scrollRef}>
        {currentView === VIEWS.BOARD && (
          <div className="p-4 max-w-4xl mx-auto space-y-6">
            <div className="bg-[#efefef] border border-gray-300 p-4 shadow-sm">
              <h2 className="text-red-600 font-bold mb-3 text-xs border-b border-gray-300 pb-1 uppercase">New Thread</h2>
              <form onSubmit={(e) => { e.preventDefault(); createThreadWithInitialPost(); }} className="space-y-3">
                <input type="text" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="スレッドのタイトル" className="w-full border border-gray-400 p-2 text-sm outline-none focus:border-blue-500 shadow-inner" required disabled={isCreatingThread} />
                <textarea value={newThreadBody} onChange={(e) => setNewThreadBody(e.target.value)} placeholder="内容" className="w-full border border-gray-400 p-2 text-sm h-24 outline-none focus:border-blue-500 resize-none shadow-inner" disabled={isCreatingThread} />
                <button disabled={isCreatingThread} className="bg-gray-200 border border-gray-500 px-4 py-1.5 text-xs font-bold active:bg-gray-300 shadow-sm disabled:opacity-50">
                  {isCreatingThread ? '作成中...' : '新規スレッド作成'}
                </button>
              </form>
            </div>
            <div className="bg-[#efefef] border border-gray-300 p-4 shadow-sm">
              <h2 className="font-bold border-b border-gray-400 mb-2 text-xs text-gray-500 uppercase">Threads</h2>
              <div className="divide-y divide-gray-200">
                {threads.map((thread, index) => (
                  <div key={thread.id} className="py-2.5 flex gap-2 items-baseline hover:bg-white px-2 transition-colors group cursor-pointer" onClick={() => { setCurrentThreadId(thread.id); setCurrentView(VIEWS.THREAD); }}>
                    <span className="text-gray-400 font-mono text-xs w-6 text-right">{index + 1}:</span>
                    <span className="text-blue-700 font-bold text-[15px] group-hover:underline">{thread.title}</span>
                    <span className="text-gray-500 text-[10px]">({thread.postCount || 0})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === VIEWS.THREAD && (
          <div className="max-w-4xl mx-auto p-4 space-y-10 min-h-full">
            {posts.map((post) => (
              <div key={post.id} className="text-[14px] leading-relaxed group border-l-2 border-transparent hover:border-blue-200 pl-3">
                <div className="flex flex-wrap gap-x-2 text-[12px] text-gray-500 mb-1">
                  <span className="font-bold text-gray-900">{post.number}</span>
                  <span className="text-green-700 font-bold">名前：{post.name}</span>
                  <span>：{formatDisplayDate(post.createdAt)}</span>
                  <span className="font-mono bg-gray-200 px-1 rounded text-[10px]">ID:{post.uid}</span>
                </div>
                <div className="ml-2 whitespace-pre-wrap break-all text-gray-800" style={{ fontFamily: '"MS PGothic", "Mona", sans-serif' }}>
                  {post.content}
                </div>
              </div>
            ))}
            <div className="h-40" />
          </div>
        )}
      </main>

      {currentView === VIEWS.THREAD && (
        <footer className="bg-[#efefef] border-t border-gray-400 p-3 shadow-lg z-50 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-red-600 font-bold text-[13px] truncate mr-4">【{currentThreadTitle}】</h1>
              <div className="flex gap-2">
                <label className="text-[10px] bg-yellow-50 border border-yellow-300 px-2 py-1 rounded-sm flex items-center gap-1 cursor-pointer select-none">
                  <input type="checkbox" checked={isAutoPosting} onChange={(e) => setIsAutoPosting(e.target.checked)} className="scale-75" />
                  <span className="font-bold text-yellow-800">AUTO</span>
                </label>
                <button onClick={() => setCurrentView(VIEWS.BOARD)} className="text-[10px] bg-gray-300 border border-gray-400 px-3 py-1 font-bold active:bg-gray-400">戻る</button>
              </div>
            </div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                if (isSubmittingPost || !currentThreadId) return;
                setIsSubmittingPost(true);
                try {
                  if (await createPost(currentThreadId, newPostName, newPostContent)) {
                    setNewPostContent(''); setNewPostName(''); setTimeout(() => performScroll(), 50);
                  }
                } finally { setIsSubmittingPost(false); }
              }} className="space-y-2">
              <input type="text" value={newPostName} onChange={(e) => setNewPostName(e.target.value)} className="border border-gray-400 p-1 text-[11px] w-40 outline-none focus:border-blue-400" placeholder="名前(sage対応)" disabled={isSubmittingPost} />
              <div className="flex gap-2">
                <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="flex-grow border border-gray-400 p-2 text-sm h-20 outline-none focus:bg-white resize-none shadow-inner" placeholder="内容を書く..." disabled={isSubmittingPost} />
                <button disabled={isSubmittingPost} className="bg-gray-200 border-b-4 border-gray-500 px-6 font-bold text-sm active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50">書込</button>
              </div>
            </form>
          </div>
        </footer>
      )}

      {currentView === VIEWS.MAINTENANCE && (
        <div className="fixed inset-0 bg-black text-[#0f0] z-[100] p-6 font-mono overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between border-b border-[#0f0] pb-2">
              <h2 className="text-xl">ABC_DYNAMICS_CONFIG</h2>
              <button onClick={() => setCurrentView(VIEWS.BOARD)} className="border border-[#0f0] px-4 py-1 hover:bg-[#0f0] hover:text-black transition-colors">CLOSE</button>
            </div>
            {Object.keys(dynParams).map((key) => {
              const dynKey = key as keyof DynParams;
              return (
                <div key={dynKey} className="flex flex-col gap-1 mb-4">
                  <div className="flex justify-between text-xs"><span>{dynKey}</span><span>{dynParams[dynKey]}</span></div>
                  <input type="range" min="0" max="2" step="0.1" value={dynParams[dynKey]} onChange={(e) => setDynParams((p) => ({ ...p, [dynKey]: parseFloat(e.target.value) }))} className="accent-[#0f0] w-full" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}