// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.Snippets
{
    public static class EnvironmentSnippets
    {
        public static ScopedApi<string> NewLine() => Static(typeof(Environment)).Property(nameof(Environment.NewLine)).As<string>();
    }
}
