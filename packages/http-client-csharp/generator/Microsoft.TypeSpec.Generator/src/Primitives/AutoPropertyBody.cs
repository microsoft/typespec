// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public record AutoPropertyBody(bool HasSetter, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None, ValueExpression? InitializationExpression = null) : PropertyBody(HasSetter);
}
