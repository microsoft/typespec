// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class TryCatchFinallyStatement : MethodBodyStatement
    {
        public TryStatement Try { get; private set; }
        public IReadOnlyList<CatchStatement> Catches { get; private set; }
        public FinallyStatement? Finally { get; private set; }

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

        public void Update(
            TryStatement? @try = null,
            IReadOnlyList<CatchStatement>? catches = null,
            FinallyStatement? @finally = null)
        {
            if (@try != null)
            {
                Try = @try;
            }
            if (catches != null)
            {
                Catches = catches;
            }
            if (@finally != null)
            {
                Finally = @finally;
            }
        }
    }
}
