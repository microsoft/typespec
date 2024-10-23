// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class StringSnippets
    {
        public static ScopedApi<int> Length(this ScopedApi<string> stringExpression) => stringExpression.Property(nameof(string.Length)).As<int>();

        public static ScopedApi<bool> Equals(ScopedApi<string> left, ScopedApi<string> right, StringComparison comparisonType)
            => Static<string>().Invoke(nameof(string.Equals), [left, right, FrameworkEnumValue(comparisonType)]).As<bool>();

        public static ScopedApi<string> Format(ScopedApi<string> format, params ValueExpression[] args)
            => Static<string>().Invoke(nameof(string.Format), args.Prepend(format).ToArray()).As<string>();

        public static ScopedApi<bool> IsNullOrWhiteSpace(ScopedApi<string> value, params ValueExpression[] args)
            => Static<string>().Invoke(nameof(string.IsNullOrWhiteSpace), args.Prepend(value).ToArray()).As<bool>();

        public static ScopedApi<string> Join(ValueExpression separator, ValueExpression values)
            => Static<string>().Invoke(nameof(string.Join), [separator, values]).As<string>();

        public static ScopedApi<string> Substring(this ScopedApi<string> stringExpression, ValueExpression startIndex)
            => stringExpression.Invoke(nameof(string.Substring), [startIndex], null, false).As<string>();

        public static ValueExpression ToCharArray(this ScopedApi<string> stringExpression)
            => stringExpression.Invoke(nameof(string.ToCharArray), Array.Empty<ValueExpression>(), null, false);

        public static ScopedApi<char> Index(this ScopedApi<string> stringExpression, ValueExpression index)
            => new IndexableExpression(stringExpression)[index].As<char>();
    }
}
