// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    internal record TypedNullConditionalExpression(TypedValueExpression Inner) : TypedValueExpression(Inner.Type, new NullConditionalExpression(Inner.Untyped));
}
