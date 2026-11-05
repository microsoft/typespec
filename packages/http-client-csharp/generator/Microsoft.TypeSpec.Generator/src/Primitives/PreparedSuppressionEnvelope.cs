// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>Confinement and freshness of standard pragma data, without executing expressions.</summary>
    internal sealed class PreparedSuppressionEnvelope
    {
        private readonly List<Func<bool>> _checks = [];
        private int _stale;

        internal static PreparedSuppressionEnvelope? TryCapture(IReadOnlyList<SuppressionStatement> values)
        {
            if (!ContractCollections.TryCopy(values, out var snapshot)) { return null; }
            var result = new PreparedSuppressionEnvelope();
            result._checks.Add(() => ContractCollections.SameReferences(values, snapshot));
            foreach (var suppression in snapshot)
            {
                if (suppression is null || suppression.GetType() != typeof(SuppressionStatement) || !SingleLine(suppression.Justification)) { return null; }
                ValueExpression code = suppression.Code;
                var depth = 0;
                while (code is ScopedApi wrapper && PreparedCallProofs.IsTransparentWrapper(wrapper))
                {
                    if (depth++ >= 32) { return null; }
                    var original = wrapper.Original;
                    var revision = wrapper.DeclarationRevision;
                    result._checks.Add(() => wrapper.DeclarationRevision == revision && ReferenceEquals(wrapper.Original, original));
                    code = original;
                }
                // The pragma writer extracts ordinary strings raw. Other values
                // can execute ToString, formatting or arbitrary expression writers.
                if (code is not LiteralExpression { Literal: string text } || !SingleLine(text)) { return null; }
            }
            return result;
        }

        internal bool IsCurrent
        {
            get
            {
                if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                if (_checks.All(check => check())) { return true; }
                System.Threading.Interlocked.Exchange(ref _stale, 1);
                return false;
            }
        }

        private static bool SingleLine(string value) => value.IndexOfAny(['\r', '\n', '\u0085', '\u2028', '\u2029']) < 0;
    }
}
