// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Common.Output.Expressions.Azure
{
    internal partial class AzureExtensibleSnippets : ExtensibleSnippets
    {
        public override JsonElementSnippets JsonElement { get; } = new AzureJsonElementSnippets();
        public override XElementSnippets XElement { get; } = new AzureXElementSnippets();
        public override XmlWriterSnippets XmlWriter { get; } = new AzureXmlWriterSnippets();
        public override RestOperationsSnippets RestOperations { get; } = new AzureRestOperationsSnippets();
        public override ModelSnippets Model { get; } = new AzureModelSnippets();
    }
}
