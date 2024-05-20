// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents expression which has a return value of a framework type.
    /// </summary>
    public sealed record FrameworkTypeExpression(Type FrameworkType, ValueExpression Untyped) : TypedValueExpression(FrameworkType, Untyped);
}
