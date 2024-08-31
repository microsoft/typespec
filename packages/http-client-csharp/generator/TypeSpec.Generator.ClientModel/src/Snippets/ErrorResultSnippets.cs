// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.ClientModel.Providers;
using TypeSpec.Generator.Primitives;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ErrorResultSnippets
    {
        private static readonly ErrorResultDefinition _errorResultProvider = new();

        public static CSharpType ErrorResultType => _errorResultProvider.Type;
    }
}
