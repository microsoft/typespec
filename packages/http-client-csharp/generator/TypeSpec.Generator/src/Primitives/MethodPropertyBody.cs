// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.Primitives
{
    public record MethodPropertyBody(MethodBodyStatement Getter, MethodBodyStatement? Setter = null, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None) : PropertyBody(HasSetter: Setter != null);
}
