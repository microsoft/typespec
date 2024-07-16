// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class StringBuilderSnippets
    {
        public static ScopedApi<int> Length(this ScopedApi<StringBuilder> sbExpression)
            => sbExpression.Property(nameof(StringBuilder.Length)).As<int>();

        public static ScopedApi<StringBuilder> Append(this ScopedApi<StringBuilder> sbExpression, ScopedApi<string> value)
            => sbExpression.Invoke(nameof(StringBuilder.Append), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> AppendLine(this ScopedApi<StringBuilder> sbExpression, ScopedApi<string> value)
            => sbExpression.Invoke(nameof(StringBuilder.AppendLine), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> Append(this ScopedApi<StringBuilder> sbExpression, ValueExpression value)
            => sbExpression.Invoke(nameof(StringBuilder.Append), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> AppendLine(this ScopedApi<StringBuilder> sbExpression, ValueExpression value)
            => sbExpression.Invoke(nameof(StringBuilder.AppendLine), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> Append(this ScopedApi<StringBuilder> sbExpression, string value)
            => sbExpression.Append(Snippet.Literal(value)).As<StringBuilder>();

        public static ScopedApi<StringBuilder> AppendLine(this ScopedApi<StringBuilder> sbExpression, string value)
            => sbExpression.AppendLine(Snippet.Literal(value)).As<StringBuilder>();

        public static ScopedApi<StringBuilder> Append(this ScopedApi<StringBuilder> sbExpression, FormattableStringExpression value)
            => sbExpression.Invoke(nameof(StringBuilder.Append), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> AppendLine(this ScopedApi<StringBuilder> sbExpression, FormattableStringExpression value)
            => sbExpression.Invoke(nameof(StringBuilder.AppendLine), value).As<StringBuilder>();

        public static ScopedApi<StringBuilder> Remove(this ScopedApi<StringBuilder> sbExpression, ValueExpression startIndex, ValueExpression length)
            => sbExpression.Invoke(nameof(StringBuilder.Remove), [startIndex, length]).As<StringBuilder>();

        public static IndexerExpression Index(this ScopedApi<StringBuilder> sbExpression, ValueExpression index) => new IndexerExpression(sbExpression, index);
    }
}
