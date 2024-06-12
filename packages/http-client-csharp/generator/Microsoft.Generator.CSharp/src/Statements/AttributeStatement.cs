// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record AttributeStatement(CSharpType Type, IReadOnlyList<ValueExpression> Arguments) : MethodBodyStatement
    {
        public AttributeStatement(CSharpType type, params ValueExpression[] arguments) : this(type, (IReadOnlyList<ValueExpression>)arguments) { }

        internal override void Write(CodeWriter writer)
        {
            if (Arguments.Any())
            {
                writer.Append($"[{Type}(");
                foreach (var argument in Arguments)
                {
                    argument.Write(writer);
                }
                writer.WriteRawLine(")]");
            }
            else
            {
                writer.WriteLine($"[{Type}]");
            }
        }
    }
}
