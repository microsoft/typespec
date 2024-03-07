// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Utilities
{
    internal static class SyntaxReferenceExtensions
    {
        public static string GetText(this SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetText().ToString(syntaxReference.Span) ?? string.Empty;

        public static FileLinePositionSpan GetFileLinePosition(this SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetLocation(syntaxReference.Span).GetLineSpan() ?? default;
    }
}
