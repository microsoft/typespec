// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public sealed record ConstructorInitializer(bool IsBase, IReadOnlyList<ValueExpression> Arguments)
    {
        public ConstructorInitializer(bool isBase, IEnumerable<ParameterProvider> arguments) : this(isBase, [.. arguments.Select(p => p.AsExpression())]) { }
    }
}
