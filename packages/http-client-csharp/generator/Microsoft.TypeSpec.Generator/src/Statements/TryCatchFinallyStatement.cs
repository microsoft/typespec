// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class TryCatchFinallyStatement : MethodBodyStatement
    {
        public TryExpression Try { get; private set; }
        public IReadOnlyList<CatchExpression> Catches { get; private set; }
        public FinallyExpression? Finally { get; private set; }

        public TryCatchFinallyStatement(TryExpression @try, IReadOnlyList<CatchExpression> catches, FinallyExpression? @finally)
        {
            Try = @try;
            Catches = catches;
            Finally = @finally;
        }

        public TryCatchFinallyStatement(TryExpression @try) : this(@try, Array.Empty<CatchExpression>(), null)
        {
        }

        public TryCatchFinallyStatement(TryExpression @try, CatchExpression @catch, FinallyExpression? @finally = null) : this(@try, new[] { @catch }, @finally)
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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitTryCatchFinallyStatement(this, methodProvider);

            if (updated is not TryCatchFinallyStatement updatedTryCatchFinallyStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var newTry = updatedTryCatchFinallyStatement.Try.Accept(visitor, methodProvider);

            var newCatches = new List<CatchExpression>(updatedTryCatchFinallyStatement.Catches.Count);
            foreach (var catchStatement in updatedTryCatchFinallyStatement.Catches)
            {
                var updatedCatch = catchStatement.Accept(visitor, methodProvider);
                newCatches.Add(updatedCatch);
            }

            var newFinally = updatedTryCatchFinallyStatement.Finally?.Accept(visitor, methodProvider);

            Try = newTry;
            Catches = newCatches;
            Finally = newFinally;

            return this;
        }

        public void Update(
            TryExpression? @try = null,
            IReadOnlyList<CatchExpression>? catches = null,
            FinallyExpression? @finally = null)
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
