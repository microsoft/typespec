// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models
{
    internal record LowLevelSubClientFactoryMethod(MethodSignature Signature, FieldDeclaration? CachingField, ICollection<Parameter> ConstructorCallParameters);
}
