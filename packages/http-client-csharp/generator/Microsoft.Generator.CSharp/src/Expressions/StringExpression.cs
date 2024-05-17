// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record StringExpression(ValueExpression Untyped) : TypedValueExpression<string>(Untyped)
    {
        public CharExpression Index(ValueExpression index) => new(new IndexerExpression(this, index));
        public CharExpression Index(int index) => Index(Snippets.Literal(index));
        public ValueExpression Length => Property(nameof(string.Length));

        public static BoolExpression Equals(StringExpression left, StringExpression right, StringComparison comparisonType)
            => new(InvokeStatic(nameof(string.Equals), new[] { left, right, Snippets.FrameworkEnumValue(comparisonType) }));

        public static StringExpression Format(StringExpression format, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Format), args.Prepend(format).ToArray()));

        public static BoolExpression IsNullOrWhiteSpace(StringExpression value, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.IsNullOrWhiteSpace), args.Prepend(value).ToArray()));

        public static StringExpression Join(ValueExpression separator, ValueExpression values)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Join), new[] { separator, values }));

        public StringExpression Substring(ValueExpression startIndex)
            => new(new InvokeInstanceMethodExpression(this, nameof(string.Substring), new[] { startIndex }, null, false));
    }
}
