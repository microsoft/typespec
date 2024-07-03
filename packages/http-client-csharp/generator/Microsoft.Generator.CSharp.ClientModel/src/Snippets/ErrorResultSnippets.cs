// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ErrorResultSnippets
    {
        private static readonly ErrorResultDefinition _errorResultProvider = new();

        public static CSharpType ErrorResultType => _errorResultProvider.Type;
    }
}
