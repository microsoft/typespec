// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator
{
    public abstract class LibraryRewriter : CSharpSyntaxRewriter
    {
        protected internal SemanticModel? SemanticModel { get; set; }
    }
}
