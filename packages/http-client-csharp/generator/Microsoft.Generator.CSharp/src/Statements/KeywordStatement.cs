// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class KeywordStatement : MethodBodyStatement
    {
        public string Keyword { get; }
        public ValueExpression? Expression { get; }

        public KeywordStatement(string keyword, ValueExpression? expression)
        {
            Keyword = keyword;
            Expression = expression;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw(Keyword);
            if (Expression is not null)
            {
                writer.AppendRaw(" ");
                Expression.Write(writer);
            }
            writer.WriteRawLine(";");
        }
    }
}
