// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record KeywordExpression(string Keyword, ValueExpression? Expression) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw(Keyword);
            if (Expression is not null)
            {
                writer.AppendRaw(" ");
                Expression.Write(writer);
            }
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
