-- Main.hs
-- foldl と foldr の違いを可視化するサンプル

module Main where

main :: IO ()
main = do
    putStrLn "=== foldl vs foldr ==="

    let xs = [1,2,3]

    -- ----------------------------------------
    -- foldl（左から畳み込む）
    -- ----------------------------------------
    let resultL = foldl (\acc x -> acc - x) 0 xs
    putStrLn ("foldl (-) 0 [1,2,3] = " ++ show resultL)

    -- 展開イメージ:
    -- ((0 - 1) - 2) - 3 = -6

    -- ----------------------------------------
    -- foldr（右から畳み込む）
    -- ----------------------------------------
    let resultR = foldr (\x acc -> x - acc) 0 xs
    putStrLn ("foldr (-) 0 [1,2,3] = " ++ show resultR)

    -- 展開イメージ:
    -- 1 - (2 - (3 - 0)) = 2

    -- ----------------------------------------
    -- 構造の違いを文字列で確認
    -- ----------------------------------------
    let showL = foldl (\acc x -> "(" ++ acc ++ " - " ++ show x ++ ")") "0" xs
    putStrLn ("foldl 構造: " ++ showL)

    let showR = foldr (\x acc -> "(" ++ show x ++ " - " ++ acc ++ ")") "0" xs
    putStrLn ("foldr 構造: " ++ showR)