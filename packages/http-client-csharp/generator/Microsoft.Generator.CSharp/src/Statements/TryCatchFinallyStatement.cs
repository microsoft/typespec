// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class TryCatchFinallyStatement : MethodBodyStatement
    {
        public MethodBodyStatement Try { get; }
        public IReadOnlyList<CatchExpression> Catches { get; }
        public MethodBodyStatement? Finally { get; }

        public TryCatchFinallyStatement(MethodBodyStatement tryStatement, IReadOnlyList<CatchExpression> catches, MethodBodyStatement? finallyStatement)
        {
            Try = tryStatement;
            Catches = catches;
            Finally = finallyStatement;
        }

        public TryCatchFinallyStatement(MethodBodyStatement Try) : this(Try, Array.Empty<CatchExpression>(), null)
        {
        }

        public TryCatchFinallyStatement(MethodBodyStatement Try, CatchExpression Catch, MethodBodyStatement? Finally = null) : this(Try, [Catch], Finally)
        {
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("try");
            using (writer.Scope())
            {
                Try.Write(writer);
            }

            foreach (var catchStatement in Catches)
            {
                catchStatement.Write(writer);
            }

            if (Finally != null)
            {
                writer.WriteRawLine("finally");
                using (writer.Scope())
                {
                    Finally.Write(writer);
                }
            }
        }
    }
}
