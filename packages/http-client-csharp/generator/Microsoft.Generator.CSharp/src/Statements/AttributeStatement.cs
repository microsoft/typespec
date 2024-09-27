// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class AttributeStatement : MethodBodyStatement
    {
        public CSharpType Type { get; }
        public IReadOnlyList<ValueExpression> Arguments { get; }
        public IReadOnlyList<KeyValuePair<string, ValueExpression>> PositionalArguments { get; }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments)
        {
            Type = type;
            Arguments = arguments;
            PositionalArguments = positionalArguments;
        }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments) : this(type, arguments, []) { }

        public AttributeStatement(CSharpType type, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments) : this(type, [], positionalArguments) { }

        public AttributeStatement(CSharpType type, params ValueExpression[] arguments) : this(type, arguments, []) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"[{Type}");
            var hasArguments = Arguments.Count > 0 || PositionalArguments.Count > 0;
            if (hasArguments)
            {
                writer.AppendRaw("(");
            }
            for (int i = 0; i < Arguments.Count; i++)
            {
                Arguments[i].Write(writer);
                if (i != Arguments.Count - 1)
                {
                    writer.AppendRaw(", ");
                }
            }
            if (Arguments.Count > 0 && PositionalArguments.Count > 0)
            {
                writer.AppendRaw(", ");
            }
            for (int i = 0; i < PositionalArguments.Count; i++)
            {
                var (key, value) = PositionalArguments[i];
                writer.Append($"{key} = ");
                value.Write(writer);
                if (i != PositionalArguments.Count - 1)
                {
                    writer.AppendRaw(", ");
                }
            }
            if (hasArguments)
            {
                writer.AppendRaw(")");
            }
            writer.WriteRawLine("]");
        }
    }
}
