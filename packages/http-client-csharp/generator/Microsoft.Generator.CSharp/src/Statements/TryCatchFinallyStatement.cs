// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class TryCatchFinallyStatement : MethodBodyStatement
    {
        public TryStatement Try { get; }
        public IReadOnlyList<CatchStatement> Catches { get; }
        public FinallyStatement? Finally { get; }

        public TryCatchFinallyStatement(TryStatement @try, IReadOnlyList<CatchStatement> catches, FinallyStatement? @finally)
        {
            Try = @try;
            Catches = catches;
            Finally = @finally;
        }

        public TryCatchFinallyStatement(TryStatement @try) : this(@try, Array.Empty<CatchStatement>(), null)
        {
        }

        public TryCatchFinallyStatement(TryStatement @try, CatchStatement @catch, FinallyStatement? @finally = null) : this(@try, new[] { @catch }, @finally)
        {
        }

        internal override void Write(CodeWriter writer)
        {
            Try.Write(writer);

            foreach (var catchStatement in Catches)
            {
                catchStatement.Write(writer);
            }

            Finally?.Write(writer);
        }
    }
}
