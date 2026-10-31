// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.Tests
{
    // Only an adapter: the executable rules now live in the generator assembly.
    // Candidate expectations and the recompilation oracle remain test-only.
    internal static class StructuralTypeNameRuleEvaluator
    {
        internal static StructuralTypeNameSelector.Selection Evaluate(IReadOnlyList<StructuralTypeNameRuleOracleTests.Prepared> configurations)
            => StructuralTypeNameSelector.Evaluate(configurations.Select(static input => new StructuralTypeNameSelector.Context(
                input.Compilation, input.Model, input.Reference,
                input.Reference == null ? null : StructuralTypeNameRuleOracleTests.ReferencedSymbol(input.Model, input.Reference) as INamedTypeSymbol)).ToArray());
    }
}
