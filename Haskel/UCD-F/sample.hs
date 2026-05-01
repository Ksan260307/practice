import Data.Bits -- ビット操作用（shiftL, .|., .&. など）
import Data.Word -- 32bit無符号整数（Word32）用
import Text.Printf -- 表示を綺麗にするため

--------------------------------------------------------------------------------
-- 1. 設計に基づくデータ構造の定義
--------------------------------------------------------------------------------

-- | 初心者でも扱いやすい「論理的な」状態データ
-- UCD-F設計書の Section 3.1 に基づく構成です
data EntityState = EntityState
  { intensityA :: Word32 -- vA: 強度A (0-3) [2bit]
  , deltaA     :: Int    -- dA: 変動ΔA (-32 to 31) [6bit]
  , stateFlag  :: Word32 -- State: 状態フラグ (0-7) [3bit]
  , ruinScore  :: Word32 -- RuinScore: 累積破綻値 (0-7) [3bit]
  } deriving (Show)

--------------------------------------------------------------------------------
-- 2. 魂のビットパッキング (Packing / Unpacking)
--------------------------------------------------------------------------------

-- | 論理的なデータを「32bitの1要素」に圧縮します
-- メモリを節約し、L1/L2キャッシュヒット率を極大化するための「魂」の工程です
packABC :: EntityState -> Word32
packABC es =
    (intensityA es .&. 0x3)          -- [0-1] vA
    .|. (shiftL (fromIntegral (deltaA es) .&. 0x3F) 6) -- [6-11] dA
    .|. (shiftL (stateFlag es .&. 0x7) 24)             -- [24-26] State
    .|. (shiftL (ruinScore es .&. 0x7) 27)             -- [27-29] RuinScore

-- | 逆に、32bit値から論理的なデータを取り出します
unpackABC :: Word32 -> EntityState
unpackABC val = EntityState
  { intensityA = val .&. 0x3
  , deltaA     = decodeDelta (shiftR val 6 .&. 0x3F)
  , stateFlag  = shiftR val 24 .&. 0x7
  , ruinScore  = shiftR val 27 .&. 0x7
  }
  where
    -- 6bitの値を符号付き整数に戻す補助関数
    decodeDelta d = if d >= 32 then fromIntegral d - 64 else fromIntegral d

--------------------------------------------------------------------------------
-- 3. VIF/ABC 統合遷移モデル (Transition)
--------------------------------------------------------------------------------

-- | 状態遷移規則 (C: Core) の実装例[cite: 1]
-- 強度(v)と変動(d)に基づいて、次のフレームの状態を計算します
tick :: EntityState -> EntityState
tick current =
  let
    -- 強度を変動分だけ変化させる（簡易的なVIFモデル）[cite: 1]
    newIntensity = (intensityA current + (if deltaA current > 0 then 1 else 0)) .&. 0x3
    -- 破綻値(RuinScore)が一定を超えたら「地形化」フラグを立てる[cite: 1]
    newRuin = if newIntensity == 0 then ruinScore current + 1 else ruinScore current
    isRuined = if newRuin >= 7 then 1 else 0 -- 状態フラグ 1:アクティブ 0:非アクティブ[cite: 1]
  in
    current { intensityA = newIntensity
            , ruinScore = newRuin .&. 0x7
            , stateFlag = if isRuined == 1 then 0 else 1
            }

--------------------------------------------------------------------------------
-- 4. 実行 (Main)
--------------------------------------------------------------------------------

main :: IO ()
main = do
  -- 初期状態：強度1, 変動+5, 状態アクティブ, 破綻0
  let start = EntityState 1 5 1 0
  let packed = packABC start

  putStrLn "--- UCD-F_ABC 起動 ---"
  printf "初期状態: %s\n" (show start)
  printf "パッキング後 (Word32): %d (0x%08x)\n" packed packed

  -- 状態を3ステップ進めてみる
  putStrLn "\n--- 3ステップ後の時間進行 ---"
  let step1 = tick start
  let step2 = tick step1
  let step3 = tick step2
  
  printf "Step 3 の状態: %s\n" (show step3)
  printf "最終的なパッキング値: 0x%08x\n" (packABC step3)