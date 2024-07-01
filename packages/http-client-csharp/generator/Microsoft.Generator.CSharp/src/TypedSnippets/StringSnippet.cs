// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StringSnippet(ValueExpression Expression) : TypedSnippet<string>(Expression)
    {
        public ValueExpression Length => Property(nameof(string.Length));

        public static ScopedApi<bool> Equals(StringSnippet left, StringSnippet right, StringComparison comparisonType)
            => new(InvokeStatic(nameof(string.Equals), [left, right, Snippet.FrameworkEnumValue(comparisonType)]));

        public static StringSnippet Format(StringSnippet format, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Format), args.Prepend(format).ToArray()));

        public static ScopedApi<bool> IsNullOrWhiteSpace(StringSnippet value, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.IsNullOrWhiteSpace), args.Prepend(value).ToArray()));

        public static StringSnippet Join(ValueExpression separator, ValueExpression values)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Join), [separator, values]));

        public StringSnippet Substring(ValueExpression startIndex)
            => new(new InvokeInstanceMethodExpression(this, nameof(string.Substring), [startIndex], null, false));
        public ValueExpression ToCharArray()
            => new InvokeInstanceMethodExpression(this, nameof(string.ToCharArray), Array.Empty<ValueExpression>(), null, false);

        public ScopedApi<char> this[ValueExpression index] => new(new IndexerExpression(this, index));

        public ScopedApi<char> this[int index] => this[Snippet.Literal(index)];
    }
}
