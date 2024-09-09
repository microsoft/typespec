// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Primitives
{
    public sealed record ConstructorInitializer(bool IsBase, IReadOnlyList<ValueExpression> Arguments)
    {
        public ConstructorInitializer(bool isBase, IEnumerable<ParameterProvider> arguments) : this(isBase, [.. arguments.Select(p => p.AsExpression)]) { }
    }
}
