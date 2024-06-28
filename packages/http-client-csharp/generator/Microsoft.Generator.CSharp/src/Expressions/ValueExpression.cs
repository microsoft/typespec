// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a single operator or operand, or a sequence of operators or operands.
    /// </summary>
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public record ValueExpression
    {
        internal virtual void Write(CodeWriter writer) { }

        public static implicit operator ValueExpression(Type type) => new TypeReferenceExpression(type);
        public static implicit operator ValueExpression(CSharpType type) => new TypeReferenceExpression(type);

        public ValueExpression NullableStructValue(CSharpType candidateType) => candidateType is { IsNullable: true, IsValueType: true } ? new MemberExpression(this, nameof(Nullable<int>.Value)) : this;
        public StringSnippet InvokeToString() => new(Invoke(nameof(ToString)));
        public ValueExpression InvokeGetType() => Invoke(nameof(GetType));
        public ValueExpression InvokeGetHashCode() => Invoke(nameof(GetHashCode));

        public BoolSnippet InvokeEquals(ValueExpression other) => new(Invoke(nameof(Equals), other));

        public virtual ValueExpression Property(string propertyName, bool nullConditional = false)
            => new MemberExpression(nullConditional ? new NullConditionalExpression(this) : this, propertyName);

        public InvokeInstanceMethodExpression Invoke(string methodName)
            => new InvokeInstanceMethodExpression(this, methodName, Array.Empty<ValueExpression>(), null, false);

        public InvokeInstanceMethodExpression Invoke(string methodName, ValueExpression arg)
            => new InvokeInstanceMethodExpression(this, methodName, new[] { arg }, null, false);

        public InvokeInstanceMethodExpression Invoke(string methodName, ValueExpression arg1, ValueExpression arg2)
            => new InvokeInstanceMethodExpression(this, methodName, new[] { arg1, arg2 }, null, false);

        public InvokeInstanceMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments)
            => new InvokeInstanceMethodExpression(this, methodName, arguments, null, false);

        public InvokeInstanceMethodExpression Invoke(MethodSignature method)
            => new InvokeInstanceMethodExpression(this, method.Name, method.Parameters.Select(p => (ValueExpression)p).ToList(), null, method.Modifiers.HasFlag(MethodSignatureModifiers.Async));

        public InvokeInstanceMethodExpression Invoke(MethodSignature method, IReadOnlyList<ValueExpression> arguments, bool addConfigureAwaitFalse = true)
            => new InvokeInstanceMethodExpression(this, method.Name, arguments, null, method.Modifiers.HasFlag(MethodSignatureModifiers.Async), AddConfigureAwaitFalse: addConfigureAwaitFalse);

        public InvokeInstanceMethodExpression Invoke(string methodName, bool async)
            => new InvokeInstanceMethodExpression(this, methodName, Array.Empty<ValueExpression>(), null, async);

        public InvokeInstanceMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments, bool async)
            => new InvokeInstanceMethodExpression(this, methodName, arguments, null, async);

        public InvokeInstanceMethodExpression Invoke(string methodName, IReadOnlyList<ValueExpression> arguments, IReadOnlyList<CSharpType>? typeArguments, bool callAsAsync, bool addConfigureAwaitFalse = true)
            => new InvokeInstanceMethodExpression(this, methodName, arguments, typeArguments, callAsAsync, addConfigureAwaitFalse);

        public CastExpression CastTo(CSharpType to) => new CastExpression(this, to);

        public BoolSnippet GreaterThan(ValueExpression other) => new(new BinaryOperatorExpression(">", this, other));

        public BoolSnippet LessThan(ValueExpression other) => new(new BinaryOperatorExpression("<", this, other));

        public BoolSnippet Equal(ValueExpression other) => new(new BinaryOperatorExpression("==", this, other));

        public BoolSnippet NotEqual(ValueExpression other) => new(new BinaryOperatorExpression("!=", this, other));

        public BoolSnippet Is(ValueExpression other) => new(new BinaryOperatorExpression("is", this, other));

        public UnaryOperatorExpression Increment() => new UnaryOperatorExpression("++", this, true);

        private string GetDebuggerDisplay()
        {
            using CodeWriter writer = new CodeWriter();
            Write(writer);
            return writer.ToString(false);
        }
    }
}
