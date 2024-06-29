// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ErrorResultSnippet(ValueExpression Expression) : TypedSnippet<ErrorResultProvider>(Expression)
    {
        private static readonly ErrorResultProvider _errorResultProvider = new();

        public static CSharpType ErrorResultType => _errorResultProvider.Type;
    }
}
