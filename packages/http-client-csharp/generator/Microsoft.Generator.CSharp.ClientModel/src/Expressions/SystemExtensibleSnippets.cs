// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets : ExtensibleSnippets
    {
        public override JsonElementSnippets JsonElement { get; } = new SystemJsonElementSnippets();
        public override RestOperationsSnippets RestOperations { get; } = new SystemRestOperationsSnippets();
        public override ModelSnippets Model { get; } = new SystemModelSnippets();
    }
}
