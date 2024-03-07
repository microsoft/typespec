// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;

namespace AutoRest.CSharp.Utilities
{
    public static class DebuggerAwaiter
    {
        public static void AwaitAttach()
        {
            while (!Debugger.IsAttached)
            {
                Console.Error.WriteLine($"Waiting for debugger to attach to process {Process.GetCurrentProcess().Id}");
                foreach (var _ in Enumerable.Range(0, 50))
                {
                    if (Debugger.IsAttached) break;
                    Thread.Sleep(100);
                    Console.Error.Write(".");
                }
                Console.Error.WriteLine();
            }
            Debugger.Break();
        }
    }
}
