// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public abstract class MethodBodyStatement : IEnumerable<MethodBodyStatement>
    {
        internal abstract void Write(CodeWriter writer);

        internal virtual MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            return this;
        }

        public static implicit operator MethodBodyStatement(MethodBodyStatement[] statements) => new MethodBodyStatements(statements);
        public static implicit operator MethodBodyStatement(List<MethodBodyStatement> statements) => new MethodBodyStatements(statements);

        private class PrivateEmptyLineStatement : MethodBodyStatement
        {
            internal override void Write(CodeWriter writer)
            {
                writer.WriteLine();
            }

            internal override MethodBodyStatement Accept(LibraryVisitor visitor, MethodProvider methodProvider)
            {
                return this;
            }
        }

        private class PrivateEmptyStatement : MethodBodyStatement
        {
            internal override void Write(CodeWriter writer)
            {
                // Do nothing
            }
            internal override MethodBodyStatement Accept(LibraryVisitor visitor, MethodProvider methodProvider)
            {
                return this;
            }
        }

        public static readonly MethodBodyStatement Empty = new PrivateEmptyStatement();
        public static readonly MethodBodyStatement EmptyLine = new PrivateEmptyLineStatement();

        public string ToDisplayString() => GetDebuggerDisplay();

        private string GetDebuggerDisplay()
        {
            using CodeWriter writer = new CodeWriter();
            Write(writer);
            return writer.ToString(false);
        }

        public IEnumerator<MethodBodyStatement> GetEnumerator()
        {
            if (this is MethodBodyStatements statements)
            {
                foreach (var statement in statements.Statements)
                {
                    foreach (var inner in statement)
                    {
                        yield return inner;
                    }
                }
            }
            else
            {
                yield return this;
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
