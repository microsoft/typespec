// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class EnvironmentSnippets
    {
        public static ScopedApi<string> NewLine() => Static(typeof(Environment)).Property(nameof(Environment.NewLine)).As<string>();
    }
}
