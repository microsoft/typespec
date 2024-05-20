// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    public sealed record ConstructorInitializer(bool IsBase, IReadOnlyList<ValueExpression> Arguments)
    {
        public ConstructorInitializer(bool isBase, IEnumerable<Parameter> arguments) : this(isBase, arguments.Select(p => (ValueExpression)p).ToArray()) { }
    }
}
