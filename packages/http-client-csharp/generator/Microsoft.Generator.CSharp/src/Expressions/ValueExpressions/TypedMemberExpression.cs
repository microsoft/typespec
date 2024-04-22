// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    internal record TypedMemberExpression(ValueExpression? Inner, string MemberName, CSharpType MemberType) : TypedValueExpression(MemberType, new MemberExpression(Inner, MemberName));
}
