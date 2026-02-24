// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal class XmlLinqSnippets
    {
        public static ScopedApi<LoadOptions> PreserveWhitespace
            => Static<LoadOptions>().Property(nameof(LoadOptions.PreserveWhitespace)).As<LoadOptions>();
    }
}
