// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class SuppressionStatement : MethodBodyStatement
    {
        public string Justification { get; }
        public ValueExpression Code { get; }
        public MethodBodyStatement Inner { get; }

        public SuppressionStatement(MethodBodyStatement inner, ValueExpression code, string justification)
        {
            Inner = inner;
            Code = code;
            Justification = justification;
        }

        public T? AsStatement<T>() where T : MethodBodyStatement => Inner as T;

        internal override void Write(CodeWriter writer)
        {
            var code = Code switch
            {
                LiteralExpression literal => literal.Literal,
                ScopedApi<string> { Original: LiteralExpression literal } => literal.Literal,
                _ => Code.ToString()
            };
            writer.WriteLine($"#pragma warning disable {code} // {Justification}");
            Inner.Write(writer);
            writer.WriteLine($"#pragma warning restore {code} // {Justification}");
        }
    }
}
