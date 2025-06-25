// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ErrorResultSnippets
    {
        private static readonly ErrorResultDefinition _errorResultProvider = new();

        public static CSharpType ErrorResultType => _errorResultProvider.Type;
    }
}
