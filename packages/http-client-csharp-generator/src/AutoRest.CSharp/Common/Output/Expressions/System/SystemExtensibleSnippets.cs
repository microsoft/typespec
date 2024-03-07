// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;

namespace AutoRest.CSharp.Common.Output.Expressions.System
{
    internal partial class SystemExtensibleSnippets : ExtensibleSnippets
    {
        public override JsonElementSnippets JsonElement { get; } = new SystemJsonElementSnippets();
        public override XElementSnippets XElement => throw new NotImplementedException("XElement extensions aren't supported in unbranded yet.");
        public override XmlWriterSnippets XmlWriter => throw new NotImplementedException("XmlWriter extensions aren't supported in unbranded yet.");
        public override RestOperationsSnippets RestOperations { get; } = new SystemRestOperationsSnippets();
        public override ModelSnippets Model { get; } = new SystemModelSnippets();
    }
}
