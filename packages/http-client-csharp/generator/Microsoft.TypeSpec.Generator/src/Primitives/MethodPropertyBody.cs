// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public record MethodPropertyBody(MethodBodyStatement Getter, MethodBodyStatement? Setter = null, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None) : PropertyBody(HasSetter: Setter != null);
}
