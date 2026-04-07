// Program.cs
// foldl / foldr の違いを C# で再現

using System;
using System.Linq;

class Program
{
    static void Main()
    {
        Console.WriteLine("=== foldl vs foldr ===");

        var xs = new[] {1, 2, 3};

        // ----------------------------------------
        // foldl（左から） = Aggregate
        // ----------------------------------------
        var resultL = xs.Aggregate(0, (acc, x) => acc - x);
        Console.WriteLine("foldl (-) 0 [1,2,3] = " + resultL);

        // 展開:
        // ((0 - 1) - 2) - 3 = -6

        // ----------------------------------------
        // foldr（右から） = ReverseしてAggregate
        // ----------------------------------------
        var resultR = xs
            .Reverse()
            .Aggregate(0, (acc, x) => x - acc);

        Console.WriteLine("foldr (-) 0 [1,2,3] = " + resultR);

        // 展開:
        // 1 - (2 - (3 - 0)) = 2

        // ----------------------------------------
        // 構造を文字列で可視化
        // ----------------------------------------
        var showL = xs.Aggregate("0", (acc, x) => $"({acc} - {x})");
        Console.WriteLine("foldl 構造: " + showL);

        var showR = xs
            .Reverse()
            .Aggregate("0", (acc, x) => $"({x} - {acc})");

        Console.WriteLine("foldr 構造: " + showR);
    }
}
