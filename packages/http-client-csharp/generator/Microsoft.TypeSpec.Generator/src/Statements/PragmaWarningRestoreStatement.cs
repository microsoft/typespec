// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class PragmaWarningRestoreStatement : MethodBodyStatement
    {
        public ValueExpression Code { get; }
        public string Justification { get; }

        public PragmaWarningRestoreStatement(ValueExpression code, string justification)
        {
            Code = code;
            Justification = justification;
        }

        internal override void Write(CodeWriter writer)
        {
            var code = Code switch
            {
                LiteralExpression literal => literal.Literal,
                ScopedApi<string> { Original: LiteralExpression literal } => literal.Literal,
                _ => Code.ToString()
            };
            writer.WriteLine($"#pragma warning restore {code} // {Justification}");
        }
    }
}
