﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a single operator or operand, or a sequence of operators or operands.
    /// </summary>
    public record ValueExpression
    {
        public virtual void Write(CodeWriter writer) { }

        public static implicit operator ValueExpression(Type type) => new TypeReference(type);
        public static implicit operator ValueExpression(CSharpType type) => new TypeReference(type);
        public static implicit operator ValueExpression(Parameter parameter) => new ParameterReference(parameter);
        public static implicit operator ValueExpression(FieldDeclaration name) => new VariableReference(name.Type, name.Declaration);
        public static implicit operator ValueExpression(PropertyDeclaration name) => new VariableReference(name.PropertyType, name.Declaration);

        public ValueExpression NullableStructValue(CSharpType candidateType) => this is not ConstantExpression && candidateType is { IsNullable: true, IsValueType: true } ? new MemberExpression(this, nameof(Nullable<int>.Value)) : this;
        public StringExpression InvokeToString() => new(Invoke(nameof(ToString)));
        public ValueExpression InvokeGetType() => Invoke(nameof(GetType));

        public BoolExpression InvokeEquals(ValueExpression other) => new(Invoke(nameof(Equals), other));

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

        public CastExpression CastTo(CSharpType to) => new CastExpression(this, to);
    }
}
