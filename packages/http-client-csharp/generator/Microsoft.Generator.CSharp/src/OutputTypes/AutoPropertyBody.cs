// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    internal record AutoPropertyBody(bool HasSetter, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None, ValueExpression? InitializationExpression = null) : PropertyBody;
}
