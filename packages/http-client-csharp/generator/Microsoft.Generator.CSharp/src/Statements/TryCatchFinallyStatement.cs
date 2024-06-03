// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record TryCatchFinallyStatement(MethodBodyStatement Try, IReadOnlyList<CatchExpression> Catches, MethodBodyStatement? Finally) : MethodBodyStatement
    {
        public TryCatchFinallyStatement(MethodBodyStatement Try) : this(Try, Array.Empty<CatchExpression>(), null)
        {
        }

        public TryCatchFinallyStatement(MethodBodyStatement Try, CatchExpression Catch, MethodBodyStatement? Finally = null) : this(Try, [Catch], Finally)
        {
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("try");
            writer.WriteRawLine("{");
            Try.Write(writer);
            writer.WriteRawLine("}");

            foreach (var catchStatement in Catches)
            {
                catchStatement.Write(writer);
            }

            if (Finally != null)
            {
                writer.WriteRawLine("finally");
                writer.WriteRawLine("{");
                Finally.Write(writer);
                writer.WriteRawLine("}");
            }
        }
    }
}
