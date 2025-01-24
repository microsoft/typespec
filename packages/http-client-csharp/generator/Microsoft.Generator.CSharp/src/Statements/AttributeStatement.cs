// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class AttributeStatement : MethodBodyStatement
    {
        public CSharpType Type { get; }
        public IReadOnlyList<ValueExpression> Arguments { get; }
        public IReadOnlyList<KeyValuePair<string, ValueExpression>> PositionalArguments { get; }

        internal AttributeData? Data { get; }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments)
        {
            Type = type;
            Arguments = arguments;
            PositionalArguments = positionalArguments;
        }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments) : this(type, arguments, []) { }

        public AttributeStatement(CSharpType type, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments) : this(type, [], positionalArguments) { }

        public AttributeStatement(CSharpType type, params ValueExpression[] arguments) : this(type, arguments, []) { }

        internal AttributeStatement(AttributeData data)
        {
            Data = data;
            Type = data.AttributeClass!.GetCSharpType();
            Arguments = data.ConstructorArguments.SelectMany(ConvertArgumentToValueExpression).ToList();
            PositionalArguments = data.NamedArguments.Select(a => new KeyValuePair<string, ValueExpression>(a.Key, ConvertArgumentToValueExpression(a.Value)[0])).ToList();
        }

        private static ValueExpression[] ConvertArgumentToValueExpression(TypedConstant argument)
        {
            return argument.Kind switch
            {
                TypedConstantKind.Primitive => [Literal(argument.Value)],
                TypedConstantKind.Enum => [Literal(argument.Value)],
                TypedConstantKind.Type => [TypeOf(((ITypeSymbol)argument.Value!).GetCSharpType())],
                TypedConstantKind.Array => [..argument.Values.SelectMany(ConvertArgumentToValueExpression)],
                _ => throw new NotSupportedException($"Unsupported argument kind: {argument.Kind}")
            };
        }

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
