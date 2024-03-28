// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        public static ExtensibleSnippets Extensible => Configuration.ApiTypes.ExtensibleSnippets;

        public static MethodBodyStatement EmptyStatement { get; } = new();
        public static MethodBodyStatement AsStatement(this IEnumerable<MethodBodyStatement> statements) => statements.ToArray();

        public static ValueExpression Dash { get; } = new KeywordExpression("_", null);
        public static ValueExpression Default { get; } = new KeywordExpression("default", null);
        public static ValueExpression Null { get; } = new KeywordExpression("null", null);
        public static ValueExpression This { get; } = new KeywordExpression("this", null);
        public static BoolExpression True { get; } = new(new KeywordExpression("true", null));
        public static BoolExpression False { get; } = new(new KeywordExpression("false", null));

        public static BoolExpression Bool(bool value) => value ? True : False;
        public static ValueExpression Int(int value) => new FormattableStringToExpression($"{value}");
        public static ValueExpression Long(long value) => new FormattableStringToExpression($"{value}L");
        public static ValueExpression Float(float value) => new FormattableStringToExpression($"{value}f");
        public static ValueExpression Double(double value) => new FormattableStringToExpression($"{value}d");

        public static ValueExpression Nameof(ValueExpression expression) => new InvokeInstanceMethodExpression(null, "nameof", new[]{expression}, null, false);
        public static ValueExpression ThrowExpression(ValueExpression expression) => new KeywordExpression("throw", expression);

        public static ValueExpression NullCoalescing(ValueExpression left, ValueExpression right) => new BinaryOperatorExpression("??", left, right);
        public static ValueExpression EnumValue(EnumType type, EnumTypeValue value) => new MemberExpression(new TypeReference(type.Type), value.Declaration.Name);
        public static ValueExpression FrameworkEnumValue<TEnum>(TEnum value) where TEnum : struct, Enum => new MemberExpression(new TypeReference(typeof(TEnum)), Enum.GetName(value)!);

        public static ValueExpression RemoveAllNullConditional(ValueExpression expression)
            => expression switch
            {
                NullConditionalExpression nullConditional => RemoveAllNullConditional(nullConditional.Inner),
                MemberExpression { Inner: {} inner } member => member with {Inner = RemoveAllNullConditional(inner)},
                TypedValueExpression typed => typed with { Untyped = RemoveAllNullConditional(typed.Untyped)},
                _ => expression
            };

        public static TypedValueExpression RemoveAllNullConditional(TypedValueExpression expression)
            => expression with { Untyped = RemoveAllNullConditional(expression.Untyped) };

        public static ValueExpression Literal(object? value) => new FormattableStringToExpression($"{value:L}");

        public static StringExpression Literal(string? value) => new(value is null ? Null : new StringLiteralExpression(value, false));
        public static StringExpression LiteralU8(string value) => new(new StringLiteralExpression(value, true));

        public static BoolExpression GreaterThan(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression(">", left, right));
        public static BoolExpression Equal(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression("==", left, right));
        public static BoolExpression NotEqual(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression("!=", left, right));

        public static BoolExpression Is(XElementExpression value, string name, out XElementExpression xElement)
            => Is<XElementExpression>(value, name, d => new XElementExpression(d), out xElement);
        public static BoolExpression Is(XAttributeExpression value, string name, out XAttributeExpression xAttribute)
            => Is<XAttributeExpression>(value, name, d => new XAttributeExpression(d), out xAttribute);

        public static BoolExpression Or(BoolExpression left, BoolExpression right) => new(new BinaryOperatorExpression("||", left.Untyped, right.Untyped));
        public static BoolExpression And(BoolExpression left, BoolExpression right) => new(new BinaryOperatorExpression("&&", left.Untyped, right.Untyped));
        public static BoolExpression Not(BoolExpression operand) => new(new UnaryOperatorExpression("!", operand, false));

        public static MethodBodyStatement EmptyLine => new EmptyLineStatement();
        public static KeywordStatement Continue => new("continue", null);
        public static KeywordStatement Return(ValueExpression expression) => new("return", expression);
        public static KeywordStatement Return() => new("return", null);
        public static KeywordStatement Throw(ValueExpression expression) => new("throw", expression);

        public static EnumerableExpression InvokeArrayEmpty(CSharpType arrayItemType)
            => new(arrayItemType, new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), new[] { arrayItemType }));

        public static StreamExpression InvokeFileOpenRead(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenRead), new[]{Literal(filePath)}));
        public static StreamExpression InvokeFileOpenWrite(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenWrite), new[]{Literal(filePath)}));

        // Expected signature: MethodName(Utf8JsonWriter writer);
        public static MethodBodyStatement InvokeCustomSerializationMethod(string methodName, Utf8JsonWriterExpression utf8JsonWriter)
            => new InvokeInstanceMethodStatement(null, methodName, utf8JsonWriter);

        // Expected signature: MethodName(StringBuilder builder);
        public static MethodBodyStatement InvokeCustomBicepSerializationMethod(string methodName, StringBuilderExpression stringBuilder)
            => new InvokeInstanceMethodStatement(null, methodName, stringBuilder);

        // Expected signature: MethodName(JsonProperty property, ref T optional)
        public static MethodBodyStatement InvokeCustomDeserializationMethod(string methodName, JsonPropertyExpression jsonProperty, CodeWriterDeclaration variable)
            => new InvokeStaticMethodStatement(null, methodName, new ValueExpression[]{jsonProperty, new FormattableStringToExpression($"ref {variable}")});

        public static AssignValueIfNullStatement AssignIfNull<T>(T variable, T expression) where T : ValueExpression => new(variable, expression);
        public static AssignValueStatement Assign<T>(T variable, T expression) where T : ValueExpression => new(variable, expression);

        public static MethodBodyStatement AssignOrReturn<T>(T? variable, T expression) where T : ValueExpression
            => variable != null ? Assign(variable, expression) : Return(expression);

        public static MethodBodyStatement InvokeConsoleWriteLine(ValueExpression expression)
            => new InvokeStaticMethodStatement(typeof(Console), nameof(Console.WriteLine), expression);

        private static BoolExpression Is<T>(T value, string name, Func<ValueExpression, T> factory, out T variable) where T : TypedValueExpression
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReference(value.Type, declaration));
            return new(new BinaryOperatorExpression("is", value, new FormattableStringToExpression($"{value.Type} {declaration:D}")));
        }
    }
}
