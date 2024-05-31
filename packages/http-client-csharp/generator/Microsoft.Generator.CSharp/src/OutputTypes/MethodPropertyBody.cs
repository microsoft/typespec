// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp
{
    internal record MethodPropertyBody(MethodBodyStatement Getter, MethodBodyStatement? Setter = null, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None) : PropertyBody(HasSetter: Setter != null);
}
