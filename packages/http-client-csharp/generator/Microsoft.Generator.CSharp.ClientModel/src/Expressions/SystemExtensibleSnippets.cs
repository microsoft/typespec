// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets : ExtensibleSnippets
    {
        public override JsonElementSnippets JsonElement { get; } = new SystemJsonElementSnippets();
        public override XElementSnippets XElement => throw new NotImplementedException("XElement extensions aren't supported in ClientModel plugin yet.");
        public override XmlWriterSnippets XmlWriter => throw new NotImplementedException("XmlWriter extensions aren't supported in ClientModel plugin yet.");
        public override RestOperationsSnippets RestOperations { get; } = new SystemRestOperationsSnippets();
        public override ModelSnippets Model { get; } = new SystemModelSnippets();
    }
}
