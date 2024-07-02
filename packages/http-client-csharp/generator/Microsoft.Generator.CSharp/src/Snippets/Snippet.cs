// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static ScopedApi<T> As<T>(this ParameterProvider parameter) => new(parameter);
        public static ScopedApi<T> As<T>(this PropertyProvider property) => new(property);
        public static DictionaryExpression AsDictionary(this FieldProvider field, CSharpType keyType, CSharpType valueType) => new(keyType, valueType, field);
        public static DictionaryExpression AsDictionary(this ParameterProvider parameter, CSharpType keyType, CSharpType valueType) => new(keyType, valueType, parameter);

        public static ValueExpression Static<T>() => TypeReferenceExpression.FromType(typeof(T));
        //overload needed since static types cannot be usd as type arguments
        public static ValueExpression Static(Type type) => TypeReferenceExpression.FromType(type);

        public static ValueExpression Identifier(string name) => new MemberExpression(null, name);
        public static MethodBodyStatement AsStatement(this IEnumerable<MethodBodyStatement> statements) => statements.ToArray();

        public static ValueExpression Dash { get; } = new KeywordExpression("_", null);

        public static ValueExpression DefaultOf(CSharpType type) => type is { IsValueType: true, IsNullable: false } ? Default.CastTo(type) : Null.CastTo(type);

        public static ValueExpression Value { get; } = new KeywordExpression("value", null);
        public static ValueExpression Default { get; } = new KeywordExpression("default", null);
        public static ValueExpression Null { get; } = new KeywordExpression("null", null);
        public static ValueExpression This { get; } = new KeywordExpression("this", null);
        public static ValueExpression Base { get; } = new KeywordExpression("base", null);
        public static ScopedApi<bool> True { get; } = new(new KeywordExpression("true", null));
        public static ScopedApi<bool> False { get; } = new(new KeywordExpression("false", null));

        public static ScopedApi<bool> Bool(bool value) => value ? True : False;
        public static ScopedApi<int> Int(int value) => new(Literal(value));
        public static ScopedApi<long> Long(long value) => new(Literal(value));
        public static ValueExpression Float(float value) => Literal(value);
        public static ValueExpression Double(double value) => Literal(value);
        public static ScopedApi<T> Checked<T>(ScopedApi<T> value) where T : struct => new KeywordExpression("checked", value).As<T>();

        public static ValueExpression Nameof(ValueExpression expression) => new InvokeInstanceMethodExpression(null, "nameof", new[] { expression }, null, false);
        public static ValueExpression ThrowExpression(ValueExpression expression) => new KeywordExpression("throw", expression);

        public static ValueExpression NullCoalescing(ValueExpression left, ValueExpression right) => new BinaryOperatorExpression("??", left, right);
        // TO-DO: Migrate remaining class as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
        //public static ValueExpression EnumValue(EnumType type, EnumTypeValue value) => new MemberExpression(new TypeReference(type.Type), value.Declaration.Name);
        public static ValueExpression FrameworkEnumValue<TEnum>(TEnum value) where TEnum : struct, Enum => new MemberExpression(TypeReferenceExpression.FromType(typeof(TEnum)), Enum.GetName(value)!);

        public static ValueExpression RemoveAllNullConditional(ValueExpression expression)
            => expression switch
            {
                NullConditionalExpression nullConditional => RemoveAllNullConditional(nullConditional.Inner),
                MemberExpression { Inner: { } inner } member => member with { Inner = RemoveAllNullConditional(inner) },
                _ => expression
            };

        public static TypedSnippet RemoveAllNullConditional(TypedSnippet snippet)
            => snippet with { Expression = RemoveAllNullConditional(snippet.Expression) };

        public static ValueExpression Literal(object? value) => new LiteralExpression(value);

        public static ScopedApi<string> Literal(string? value) => new(value is null ? Null : new LiteralExpression(value));
        public static ScopedApi<string> LiteralU8(string value) => new(new UnaryOperatorExpression("u8", new LiteralExpression(value), true));

        public static ScopedApi<bool> Not(ValueExpression operand) => new(new UnaryOperatorExpression("!", operand, false));

        public static MethodBodyStatement Continue => new KeywordExpression("continue", null).Terminate();
        public static MethodBodyStatement Break => new KeywordExpression("break", null).Terminate();
        public static MethodBodyStatement Return(ValueExpression expression) => new KeywordExpression("return", expression).Terminate();
        public static MethodBodyStatement Return() => new KeywordExpression("return", null).Terminate();
        public static MethodBodyStatement Throw(ValueExpression expression) => new KeywordExpression("throw", expression).Terminate();

        public static EnumerableSnippet ArrayEmpty(CSharpType arrayItemType)
            => new(arrayItemType, new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), new[] { arrayItemType }));

        public static AssignmentExpression Assign(this ValueExpression to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this ParameterProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this FieldProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this TypedSnippet to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this PropertyProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);

        public static MethodBodyStatement InvokeConsoleWriteLine(ValueExpression expression)
            => new InvokeStaticMethodExpression(typeof(Console), nameof(Console.WriteLine), expression).Terminate();

        // TO-DO: Migrate code from autorest as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
        public static InvokeInstanceMethodExpression Invoke(this ParameterProvider parameter, string methodName, ValueExpression arg)
            => new InvokeInstanceMethodExpression(parameter, methodName, [arg], null, false);

        public static InvokeInstanceMethodExpression Invoke(this ParameterProvider parameter, string methodName)
            => new InvokeInstanceMethodExpression(parameter, methodName, Array.Empty<ValueExpression>(), null, false);

        public static ValueExpression Property(this ParameterProvider parameter, string propertyName, bool nullConditional = false)
            => new MemberExpression(nullConditional ? new NullConditionalExpression(parameter) : parameter, propertyName);

        public static ValueExpression Invoke(this FieldProvider field, string methodName, IEnumerable<ValueExpression> parameters, bool isAsync, bool configureAwait)
            => new InvokeInstanceMethodExpression(field, methodName, [.. parameters], null, isAsync, configureAwait);

        public static ScopedApi<bool> NotEqual(this ParameterProvider parameter, ValueExpression other)
            => new BinaryOperatorExpression("!=", parameter, other).As<bool>();
    }
}
