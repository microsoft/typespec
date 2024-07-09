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

        public static BoolSnippet Equals(StringSnippet left, StringSnippet right, StringComparison comparisonType)
            => new(InvokeStatic(nameof(string.Equals), new[] { left, right, Snippet.FrameworkEnumValue(comparisonType) }));

        public static StringSnippet Format(StringSnippet format, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Format), args.Prepend(format).ToArray()));

        public static BoolSnippet IsNullOrWhiteSpace(StringSnippet value, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.IsNullOrWhiteSpace), args.Prepend(value).ToArray()));

        public static StringSnippet Join(ValueExpression separator, ValueExpression values)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Join), new[] { separator, values }));

        public StringSnippet Substring(ValueExpression startIndex)
            => new(new InvokeInstanceMethodByNameExpression(this, nameof(string.Substring), new[] { startIndex }, null, false));
        public ValueExpression ToCharArray()
            => new InvokeInstanceMethodByNameExpression(this, nameof(string.ToCharArray), Array.Empty<ValueExpression>(), null, false);

        public CharSnippet this[ValueExpression index] => new(new IndexerExpression(this, index));

        public CharSnippet this[int index] => this[Snippet.Literal(index)];
    }
}
