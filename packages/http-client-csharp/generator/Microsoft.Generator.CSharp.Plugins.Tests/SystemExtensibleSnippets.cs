// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets : ExtensibleSnippets
    {
        public override JsonElementSnippets JsonElement => throw new NotImplementedException("JsonElement extensions aren't supported in ClientModel plugin yet.");
        public override XElementSnippets XElement => throw new NotImplementedException("XElement extensions aren't supported in ClientModel plugin yet.");
        public override XmlWriterSnippets XmlWriter => throw new NotImplementedException("XmlWriter extensions aren't supported in ClientModel plugin yet.");
        public override RestOperationsSnippets RestOperations => throw new NotImplementedException("RestOperations extensions aren't supported in ClientModel plugin yet.");
        public override ModelSnippets Model => throw new NotImplementedException("Model extensions aren't supported in ClientModel plugin yet.");
    }
}
