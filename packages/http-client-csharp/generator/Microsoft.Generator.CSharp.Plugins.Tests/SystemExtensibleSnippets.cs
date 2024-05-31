// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets : ExtensibleSnippets
    {
        public override RestOperationsSnippets RestOperations => throw new NotImplementedException("RestOperations extensions aren't supported in ClientModel plugin yet.");
        public override ModelSnippets Model => throw new NotImplementedException("Model extensions aren't supported in ClientModel plugin yet.");
    }
}
