// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    public sealed record CSharpAttribute(CSharpType Type, IReadOnlyList<ValueExpression> Arguments)
    {
        public CSharpAttribute(CSharpType type, params ValueExpression[] arguments) : this(type, (IReadOnlyList<ValueExpression>)arguments) { }
    }
}
