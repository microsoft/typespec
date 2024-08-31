// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Primitives;

namespace TypeSpec.Generator.Statements
{
    public sealed class AttributeStatement : MethodBodyStatement
    {
        public CSharpType Type { get; }
        public IReadOnlyList<ValueExpression> Arguments { get; }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments)
        {
            Type = type;
            Arguments = arguments;
        }

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
