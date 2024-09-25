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
        public IReadOnlyDictionary<string, ValueExpression> PositionalArguments { get; }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments, IReadOnlyDictionary<string, ValueExpression> positionalArguments)
        {
            Type = type;
            Arguments = arguments;
            PositionalArguments = positionalArguments;
        }

        public AttributeStatement(CSharpType type, params ValueExpression[] arguments) : this(type, arguments, new Dictionary<string, ValueExpression>()) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append($"[{Type}");
            var hasArguments = Arguments.Count > 0 || PositionalArguments.Count > 0;
            if (hasArguments)
            {
                writer.AppendRaw("(");
            }
            if (Arguments.Count > 0)
            {
                for (int i = 0; i < Arguments.Count; i++)
                {
                    Arguments[i].Write(writer);
                    if (i != Arguments.Count - 1)
                    {
                        writer.AppendRaw(", ");
                    }
                }
            }
            if (hasArguments)
            {
                writer.AppendRaw(")");
            }
            writer.AppendRaw("]");
        }
    }
}
