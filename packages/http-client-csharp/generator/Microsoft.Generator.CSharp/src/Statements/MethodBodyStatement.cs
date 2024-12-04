// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics;

namespace Microsoft.Generator.CSharp.Statements
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class MethodBodyStatement
    {
        internal virtual void Write(CodeWriter writer) { }
        public static implicit operator MethodBodyStatement(MethodBodyStatement[] statements) => new MethodBodyStatements(statements);
        public static implicit operator MethodBodyStatement(List<MethodBodyStatement> statements) => new MethodBodyStatements(statements);

        private class PrivateEmptyLineStatement : MethodBodyStatement
        {
            internal override void Write(CodeWriter writer)
            {
                writer.WriteLine();
            }
        }

        public static readonly MethodBodyStatement Empty = new();
        public static readonly MethodBodyStatement EmptyLine = new PrivateEmptyLineStatement();

        public string ToDisplayString() => GetDebuggerDisplay();

        public IEnumerable<MethodBodyStatement> Flatten()
        {
            Queue<MethodBodyStatement> queue = new();
            queue.Enqueue(this);

            while (queue.Count > 0)
            {
                MethodBodyStatement current = queue.Dequeue();

                if (current is MethodBodyStatements statements)
                {
                    foreach (var subStatement in statements.Statements)
                    {
                        queue.Enqueue(subStatement);
                    }
                }
                else
                {
                    yield return current;
                }
            }
        }

        private string GetDebuggerDisplay()
        {
            using CodeWriter writer = new CodeWriter();
            Write(writer);
            return writer.ToString(false);
        }
    }
}
