// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TryCatchFinallyStatement(MethodBodyStatement Try, IReadOnlyList<CatchStatement> Catches, MethodBodyStatement? Finally) : MethodBodyStatement
    {
        public TryCatchFinallyStatement(MethodBodyStatement Try) : this(Try, Array.Empty<CatchStatement>(), null)
        {
        }

        public TryCatchFinallyStatement(MethodBodyStatement Try, CatchStatement Catch, MethodBodyStatement? Finally = null) : this(Try, [Catch], Finally)
        {
        }

        public override void Write(CodeWriter writer)
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
