// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;

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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitTryCatchFinallyStatement(this, methodProvider);

            if (updated is not TryCatchFinallyStatement updatedTryCatchFinallyStatement)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var newTry = updatedTryCatchFinallyStatement.Try.Accept(visitor, methodProvider);
            if (newTry is not TryStatement updatedTry)
            {
                throw new InvalidOperationException("Expected updated Try statement.");
            }
            bool hasChanges = !ReferenceEquals(updatedTry, Try);

            var newCatches = new List<CatchStatement>(updatedTryCatchFinallyStatement.Catches.Count);
            foreach (var catchStatement in updatedTryCatchFinallyStatement.Catches)
            {
                var updatedCatch = catchStatement.Accept(visitor, methodProvider);
                if (updatedCatch is not CatchStatement updatedCatchStatement)
                {
                    throw new InvalidOperationException("Expected updated Catch statement.");
                }
                if (!ReferenceEquals(updatedCatchStatement, catchStatement))
                {
                    hasChanges = true;
                }
                newCatches.Add(updatedCatchStatement);
            }
            if (newCatches.Count != updatedTryCatchFinallyStatement.Catches.Count)
            {
                hasChanges = true;
            }

            var updatedFinally = updatedTryCatchFinallyStatement.Finally?.Accept(visitor, methodProvider);
            if (updatedFinally is not FinallyStatement updatedFinallyStatement)
            {
                throw new InvalidOperationException("Expected updated Finally statement.");
            }

            var newFinallyStatements = new List<MethodBodyStatement>(updatedFinallyStatement.Body.Count);
            foreach (var statement in updatedFinallyStatement.Body)
            {
                var updatedStatement = statement.Accept(visitor, methodProvider);
                if (!ReferenceEquals(updatedStatement, statement))
                {
                    hasChanges = true;
                }
                if (updatedStatement != null)
                {
                    newFinallyStatements.Add(updatedStatement);
                }
            }
            if (!hasChanges && newFinallyStatements.Count == updatedFinallyStatement.Body.Count)
            {
                return updated;
            }

            return new TryCatchFinallyStatement(updatedTry, newCatches, updatedFinallyStatement);
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
