// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static partial class Snippet
    {
        public static ScopedApi<bool> Equal(this ParameterProvider parameter, ValueExpression other) => new BinaryOperatorExpression("==", parameter, other).As<bool>();
        public static ScopedApi<bool> Is(this ParameterProvider parameter, ValueExpression other) => new BinaryOperatorExpression("is", parameter, other).As<bool>();

        public static ScopedApi As(this ParameterProvider parameter, CSharpType type) => ((ValueExpression)parameter).As(type);
        public static ScopedApi<T> As<T>(this ParameterProvider parameter) => ((ValueExpression)parameter).As<T>();
        public static ScopedApi<T> As<T>(this PropertyProvider property) => ((ValueExpression)property).As<T>();
        public static ScopedApi<T> As<T>(this FieldProvider field) => ((ValueExpression)field).As<T>();

        public static ValueExpression NullConditional(this ParameterProvider parameter) => new NullConditionalExpression(parameter);
        public static ValueExpression NullConditional(this FieldProvider field) => new NullConditionalExpression(field);

        public static ValueExpression NullCoalesce(this ParameterProvider parameter, ValueExpression value) => new BinaryOperatorExpression("??", parameter, value);
        public static ValueExpression NullCoalesce(this FieldProvider field, ValueExpression value) => new BinaryOperatorExpression("??", field, value);
        public static ValueExpression PositionalReference(this ParameterProvider parameter, ValueExpression value)
            => new PositionalParameterReferenceExpression(parameter.Name, value);

        public static ValueExpression PositionalReference(string parameterName, ValueExpression value)
            => new PositionalParameterReferenceExpression(parameterName, value);

        public static DictionaryExpression AsDictionary(this FieldProvider field, CSharpType keyType, CSharpType valueType) => new(new KeyValuePairType(keyType, valueType), field);
        public static DictionaryExpression AsDictionary(this ParameterProvider parameter, CSharpType keyType, CSharpType valueType) => new(new KeyValuePairType(keyType, valueType), parameter);
        public static DictionaryExpression AsDictionary(this PropertyProvider property, CSharpType keyType, CSharpType valueType) => new(new KeyValuePairType(keyType, valueType), property);

        public static TypeOfExpression TypeOf(CSharpType type) => new TypeOfExpression(type);

        public static ValueExpression Static<T>() => TypeReferenceExpression.FromType(typeof(T));
        //overload needed since static types cannot be usd as type arguments
        public static ValueExpression Static(Type type) => TypeReferenceExpression.FromType(new CSharpType(type).WithNullable(false));
        public static ValueExpression Static(CSharpType type) => TypeReferenceExpression.FromType(type.WithNullable(false));
        public static ValueExpression Static() => TypeReferenceExpression.FromType(null);

        public static ValueExpression Identifier(string name) => new MemberExpression(null, name);
        public static MethodBodyStatement AsStatement(this IEnumerable<MethodBodyStatement> statements) => statements.ToArray();

        public static ValueExpression Dash { get; } = new KeywordExpression("_", null);

        public static ValueExpression DefaultOf(CSharpType type) => type is { IsValueType: true, IsNullable: false } ? Default.CastTo(type) : Null.CastTo(type);

        public static ValueExpression Value { get; } = new KeywordExpression("value", null);
        public static ValueExpression Default { get; } = new KeywordExpression("default", null);
        public static ValueExpression Null { get; } = new KeywordExpression("null", null);
        public static ValueExpression This { get; } = new KeywordExpression("this", null);
        public static ValueExpression Base { get; } = new KeywordExpression("base", null);
        public static ScopedApi<bool> True { get; } = new KeywordExpression("true", null).As<bool>();
        public static ScopedApi<bool> False { get; } = new KeywordExpression("false", null).As<bool>();

        public static MethodBodyStatement YieldReturn(ValueExpression variable) => new YieldReturnStatement(variable);

        public static MethodBodyStatement YieldBreak() => new YieldBreakStatement();

        public static ScopedApi<bool> Bool(bool value) => value ? True : False;
        public static ScopedApi<int> Int(int value) => Literal(value).As<int>();
        public static ScopedApi<long> Long(long value) => Literal(value).As<long>();
        public static ValueExpression Float(float value) => Literal(value);
        public static ValueExpression Double(double value) => Literal(value);
        public static ScopedApi<T> Checked<T>(ScopedApi<T> value) where T : struct => new KeywordExpression("checked", value).As<T>();

        public static ValueExpression Nameof(ValueExpression expression) => new InvokeMethodExpression(null, "nameof", new[] { expression });
        public static ValueExpression ThrowExpression(ValueExpression expression) => new KeywordExpression("throw", expression);

        public static ValueExpression FrameworkEnumValue<TEnum>(TEnum value) where TEnum : struct, Enum => new MemberExpression(TypeReferenceExpression.FromType(typeof(TEnum)), Enum.GetName(value)!);

        public static ValueExpression RemoveAllNullConditional(ValueExpression expression)
            => expression switch
            {
                NullConditionalExpression nullConditional => RemoveAllNullConditional(nullConditional.Inner),
                MemberExpression { Inner: { } inner } member => member with { Inner = RemoveAllNullConditional(inner) },
                _ => expression
            };

        public static ValueExpression Literal(object? value) => new LiteralExpression(value);

        public static ScopedApi<char> Literal(char value) => new LiteralExpression(value).As<char>();

        public static ScopedApi<int> Literal(int value) => new LiteralExpression(value).As<int>();

        public static ScopedApi<string> Literal(string? value) => (value is null ? Null : new LiteralExpression(value)).As<string>();
        public static ScopedApi<string> LiteralU8(string value) => new UnaryOperatorExpression("u8", new LiteralExpression(value), true).As<string>();

        public static ValueExpression Spread(ValueExpression expression) => new UnaryOperatorExpression(".. ", expression, false);
        public static ScopedApi<bool> Not(ValueExpression operand) => new UnaryOperatorExpression("!", operand, false).As<bool>();

        public static MethodBodyStatement Continue => new KeywordExpression("continue", null).Terminate();
        public static MethodBodyStatement Break => new KeywordExpression("break", null).Terminate();
        public static MethodBodyStatement Return(ValueExpression expression) => new KeywordExpression("return", expression).Terminate();
        public static MethodBodyStatement Return() => new KeywordExpression("return", null).Terminate();
        public static MethodBodyStatement Throw(ValueExpression? expression = default) => new KeywordExpression("throw", expression).Terminate();

        public static ValueExpression ByRef(ValueExpression expression) => new KeywordExpression("ref", expression);

        public static ValueExpression ArrayEmpty(CSharpType arrayItemType)
            => Static<Array>().Invoke(nameof(Array.Empty), [], [arrayItemType], false);

        public static AssignmentExpression Assign(this ParameterProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this FieldProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this PropertyProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);

        public static CatchExpression Catch(DeclarationExpression declare, params MethodBodyStatement[] statements) => new CatchExpression(declare, statements);

        public static MethodBodyStatement InvokeConsoleWriteLine(ValueExpression expression)
            => Static(typeof(Console)).Invoke(nameof(Console.WriteLine), expression).Terminate();

        public static InvokeMethodExpression Invoke(this ParameterProvider parameter, string methodName, ValueExpression arg)
            => new InvokeMethodExpression(parameter, methodName, [arg]);

        public static InvokeMethodExpression Invoke(this ParameterProvider parameter,
            string methodName,
            IReadOnlyList<ValueExpression> args,
            IReadOnlyList<CSharpType> typeArgs)
            => new InvokeMethodExpression(parameter, methodName, args) { TypeArguments = typeArgs };

        public static InvokeMethodExpression Invoke(this ParameterProvider parameter, string methodName, params ValueExpression[] args)
            => new InvokeMethodExpression(parameter, methodName, args);

        public static InvokeMethodExpression Invoke(this ParameterProvider parameter, string methodName, CSharpType? extensionType = null)
            => new InvokeMethodExpression(parameter, methodName, Array.Empty<ValueExpression>()) { ExtensionType = extensionType};

        public static InvokeMethodExpression InvokeLambda(this ParameterProvider parameter, params ValueExpression[] args)
            => new InvokeMethodExpression(null, parameter.Name, args);

        public static ValueExpression Property(this ParameterProvider parameter, string propertyName, bool nullConditional = false)
            => new MemberExpression(nullConditional ? new NullConditionalExpression(parameter) : parameter, propertyName);

        public static ValueExpression Property(this FieldProvider field, string propertyName, bool nullConditional = false)
            => new MemberExpression(nullConditional ? new NullConditionalExpression(field) : field, propertyName);

        public static InvokeMethodExpression Invoke(this FieldProvider field, string methodName, IEnumerable<ValueExpression> parameters, CSharpType? extensionType = null)
            => field.Invoke(methodName, parameters, false, false, extensionType: extensionType);

        public static InvokeMethodExpression Invoke(this FieldProvider field,
            string methodName,
            IEnumerable<ValueExpression> parameters,
            bool isAsync,
            bool configureAwait,
            CSharpType? extensionType = null)
            => new InvokeMethodExpression(field, methodName, [.. parameters])
            {
                CallAsAsync = isAsync,
                AddConfigureAwaitFalse = configureAwait,
                ExtensionType = extensionType
            };

        public static ValueExpression Invoke(this PropertyProvider property,
            string methodName,
            IEnumerable<ValueExpression> parameters,
            bool isAsync,
            bool configureAwait,
            CSharpType? extensionType = null)
            => new InvokeMethodExpression(property, methodName, [.. parameters])
            {
                CallAsAsync = isAsync,
                AddConfigureAwaitFalse = configureAwait,
                ExtensionType = extensionType
            };

        public static ScopedApi<bool> NotEqual(this ParameterProvider parameter, ValueExpression other)
            => new BinaryOperatorExpression("!=", parameter, other).As<bool>();

        public static VariableExpression AsVariable(this ParameterProvider parameter) => ParameterProvider.GetVariableExpression(parameter, includeModifiers: false);
        public static VariableExpression AsArgument(this ParameterProvider property) => ParameterProvider.GetVariableExpression(property, includeModifiers: true);
    }
}
