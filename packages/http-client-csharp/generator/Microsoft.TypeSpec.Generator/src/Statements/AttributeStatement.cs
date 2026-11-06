// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class AttributeStatement : MethodBodyStatement
    {
        public CSharpType Type
        {
            get
            {
                if (_type is null)
                {
                    _type = Data!.AttributeClass!.GetCSharpType();
                    DeclaredTypeSnapshot.TryCapture(_type, out _dataTypeOrigin);
                }
                return _type;
            }
        }
        private CSharpType? _type;
        private DeclaredTypeSnapshot? _dataTypeOrigin;

        public IReadOnlyList<ValueExpression> Arguments
        {
            get
            {
                if (_arguments is null)
                {
                    _arguments = Data!.ConstructorArguments.SelectMany(ConvertArgumentToValueExpression).ToList();
                    _dataArgumentsOrigin = new AttributeProjectionValues(_arguments);
                }
                return _arguments;
            }
        }
        private IReadOnlyList<ValueExpression>? _arguments;
        private AttributeProjectionValues? _dataArgumentsOrigin;

        public IReadOnlyList<KeyValuePair<string, ValueExpression>> PositionalArguments
        {
            get
            {
                if (_positionalArguments is null)
                {
                    _positionalArguments = Data!.NamedArguments.Select(a => new KeyValuePair<string, ValueExpression>(a.Key, ConvertArgumentToValueExpression(a.Value)[0])).ToList();
                    _dataNamedKeys = _positionalArguments.Select(argument => argument.Key).ToArray();
                    _dataNamedOrigin = new AttributeProjectionValues(_positionalArguments.Select(argument => argument.Value).ToArray());
                }
                return _positionalArguments;
            }
        }
        private IReadOnlyList<KeyValuePair<string, ValueExpression>>? _positionalArguments;
        private string[]? _dataNamedKeys;
        private AttributeProjectionValues? _dataNamedOrigin;

        internal AttributeData? Data { get; }
        internal CSharpType? CachedType => _type;
        internal IReadOnlyList<ValueExpression>? CachedArguments => _arguments;
        internal IReadOnlyList<KeyValuePair<string, ValueExpression>>? CachedPositionalArguments => _positionalArguments;

        internal bool IsOriginalDataProjectionCurrent()
        {
            if (_type is not null && _dataTypeOrigin?.IsCurrent() != true ||
                _arguments is not null && _dataArgumentsOrigin?.IsCurrent(_arguments) != true)
            {
                return false;
            }
            if (_positionalArguments is null)
            {
                return true;
            }
            return ContractCollections.TryCopy(_positionalArguments, out var named) && _dataNamedKeys is not null &&
                named.Length == _dataNamedKeys.Length && named.Select((item, index) => item.Key == _dataNamedKeys[index]).All(same => same) &&
                _dataNamedOrigin?.IsCurrent(named.Select(item => item.Value).ToArray()) == true;
        }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments)
        {
            _type = type;
            _arguments = arguments;
            _positionalArguments = positionalArguments;
        }

        public AttributeStatement(CSharpType type, IReadOnlyList<ValueExpression> arguments) : this(type, arguments, []) { }

        public AttributeStatement(CSharpType type, IReadOnlyList<KeyValuePair<string, ValueExpression>> positionalArguments) : this(type, [], positionalArguments) { }

        public AttributeStatement(CSharpType type, params ValueExpression[] arguments) : this(type, arguments, []) { }

        internal AttributeStatement(AttributeData data)
        {
            Data = data;
        }

        private static IReadOnlyList<ValueExpression> ConvertArgumentToValueExpression(TypedConstant argument)
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

        internal override void WriteCore(CodeWriter writer)
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
            writer.AppendRaw("]");
        }
    }
}
