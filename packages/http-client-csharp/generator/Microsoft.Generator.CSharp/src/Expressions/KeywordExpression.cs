// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
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
