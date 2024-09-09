// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a single operator or operand, or a sequence of operators or operands.
    /// </summary>
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public record ValueExpression
    {
        public static readonly ValueExpression Empty = new();

        private protected ValueExpression() { }

        internal virtual void Write(CodeWriter writer) { }

        protected internal virtual bool IsEmptyExpression() => ReferenceEquals(this, Empty);

        public static implicit operator ValueExpression(Type type) => TypeReferenceExpression.FromType(type);
        public static implicit operator ValueExpression(CSharpType type) => TypeReferenceExpression.FromType(type);

        public ScopedApi<T> As<T>()
        {
            if (this is ScopedApi<T> scopedApi)
            {
                return scopedApi;
            }

            return new ScopedApi<T>(this);
        }

        public ScopedApi As(CSharpType type)
        {
            if (this is ScopedApi scopedApi && scopedApi.Type.Equals(type))
            {
                return scopedApi;
            }

            return new ScopedApi(type, this);
        }

        public DictionaryExpression AsDictionary(CSharpType keyType, CSharpType valueType) => new(new KeyValuePairType(keyType, valueType), this);
        public DictionaryExpression AsDictionary(CSharpType dictionaryType) => new(dictionaryType, this);

        public ValueExpression NullableStructValue(CSharpType candidateType)
            => candidateType is { IsNullable: true, IsValueType: true } ? new MemberExpression(this, nameof(Nullable<int>.Value)) : this;
        public ScopedApi<string> InvokeToString() => Invoke(nameof(ToString)).As<string>();
        public ValueExpression InvokeGetType() => Invoke(nameof(GetType));
        public ValueExpression InvokeGetHashCode() => Invoke(nameof(GetHashCode));

        public ScopedApi<bool> InvokeEquals(ValueExpression other) => Invoke(nameof(Equals), other).As<bool>();

        public ValueExpression Property(string propertyName) => new MemberExpression(this, propertyName);

        public InvokeMethodExpression Invoke(string methodName)
            => new InvokeMethodExpression(this, methodName, []);

        public InvokeMethodExpression Invoke(string methodName, ValueExpression arg)
            => new InvokeMethodExpression(this, methodName, [arg]);

        public InvokeMethodExpression Invoke(string methodName, ValueExpression arg1, ValueExpression arg2)
            => new InvokeMethodExpression(this, methodName, [arg1, arg2]);

        public InvokeMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments)
            => new InvokeMethodExpression(this, methodName, arguments);

        public InvokeMethodExpression Invoke(MethodSignature methodSignature)
            => new InvokeMethodExpression(this, methodSignature, [.. methodSignature.Parameters])
            {
                CallAsAsync = methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Async)
            };

        public InvokeMethodExpression Invoke(MethodSignature methodSignature, IReadOnlyList<ValueExpression> arguments, bool addConfigureAwaitFalse = true)
            => new InvokeMethodExpression(this, methodSignature, arguments)
            {
                CallAsAsync = methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Async),
                AddConfigureAwaitFalse = addConfigureAwaitFalse
            };

        public InvokeMethodExpression Invoke(string methodName, bool async)
            => new InvokeMethodExpression(this, methodName, []);

        public InvokeMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments, bool async)
            => new InvokeMethodExpression(this, methodName, arguments) { CallAsAsync = async };

        public InvokeMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<CSharpType>? typeArguments, bool callAsAsync, bool addConfigureAwaitFalse = true, CSharpType? extensionType = null)
            => new InvokeMethodExpression(this, methodName, arguments)
            {
                TypeArguments = typeArguments,
                CallAsAsync = callAsAsync,
                AddConfigureAwaitFalse = addConfigureAwaitFalse,
                ExtensionType = extensionType
            };

        public CastExpression CastTo(CSharpType to) => new CastExpression(this, to);

        public ScopedApi<bool> GreaterThan(ValueExpression other) => new BinaryOperatorExpression(">", this, other).As<bool>();
        public ScopedApi<bool> GreaterThanOrEqual(ValueExpression other) => new BinaryOperatorExpression(">=", this, other).As<bool>();

        public ScopedApi<bool> LessThan(ValueExpression other) => new BinaryOperatorExpression("<", this, other).As<bool>();

        public ScopedApi<bool> Equal(ValueExpression other) => new BinaryOperatorExpression("==", this, other).As<bool>();

        public ScopedApi<bool> NotEqual(ValueExpression other) => new BinaryOperatorExpression("!=", this, other).As<bool>();

        public ScopedApi<bool> Is(ValueExpression other) => new BinaryOperatorExpression("is", this, other).As<bool>();

        public UnaryOperatorExpression Increment() => new UnaryOperatorExpression("++", this, true);

        public ValueExpression AndExpr(ValueExpression other) => new BinaryOperatorExpression("and", this, other);

        public ValueExpression NullConditional() => new NullConditionalExpression(this);

        public AssignmentExpression Assign(ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(this, value, nullCoalesce);

        public ValueExpression NullCoalesce(ValueExpression right) => new BinaryOperatorExpression("??", this, right);

        public string ToDisplayString() => GetDebuggerDisplay();

        private string GetDebuggerDisplay()
        {
            using CodeWriter writer = new CodeWriter();
            Write(writer);
            return writer.ToString(false);
        }
    }
}
