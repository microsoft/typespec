// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static ExtensibleSnippets Extensible => CodeModelPlugin.Instance.ExtensibleSnippets;
        public static MethodBodyStatement EmptyStatement { get; } = new();
        public static MethodBodyStatement AsStatement(this IEnumerable<MethodBodyStatement> statements) => statements.ToArray();

        public static ValueExpression Dash { get; } = new KeywordExpression("_", null);

        public static ValueExpression DefaultOf(CSharpType type) => type is { IsValueType: true, IsNullable: false } ? Default.CastTo(type) : Null.CastTo(type);

        public static ValueExpression Default { get; } = new KeywordExpression("default", null);
        public static ValueExpression Null { get; } = new KeywordExpression("null", null);
        public static ValueExpression This { get; } = new KeywordExpression("this", null);
        public static BoolSnippet True { get; } = new(new KeywordExpression("true", null));
        public static BoolSnippet False { get; } = new(new KeywordExpression("false", null));

        public static BoolSnippet Bool(bool value) => value ? True : False;
        public static IntSnippet Int(int value) => new(Literal(value));
        public static LongSnippet Long(long value) => new(Literal(value));
        public static ValueExpression Float(float value) => Literal(value);
        public static ValueExpression Double(double value) => Literal(value);

        public static ValueExpression Nameof(ValueExpression expression) => new InvokeInstanceMethodExpression(null, "nameof", new[] { expression }, null, false);
        public static ValueExpression ThrowExpression(ValueExpression expression) => new KeywordExpression("throw", expression);

        public static ValueExpression NullCoalescing(ValueExpression left, ValueExpression right) => new BinaryOperatorExpression("??", left, right);
        // TO-DO: Migrate remaining class as part of output classes migration : https://github.com/Azure/autorest.csharp/issues/4198
        //public static ValueExpression EnumValue(EnumType type, EnumTypeValue value) => new MemberExpression(new TypeReference(type.Type), value.Declaration.Name);
        public static ValueExpression FrameworkEnumValue<TEnum>(TEnum value) where TEnum : struct, Enum => new MemberExpression(new TypeReferenceExpression(typeof(TEnum)), Enum.GetName(value)!);

        public static ValueExpression RemoveAllNullConditional(ValueExpression expression)
            => expression switch
            {
                NullConditionalExpression nullConditional => RemoveAllNullConditional(nullConditional.Inner),
                MemberExpression { Inner: { } inner } member => member with { Inner = RemoveAllNullConditional(inner) },
                _ => expression
            };

        public static TypedSnippet RemoveAllNullConditional(TypedSnippet expression)
            => expression with { Untyped = RemoveAllNullConditional(expression.Untyped) };

        public static ValueExpression Literal(object? value) => new LiteralExpression(value);

        public static StringSnippet Literal(string? value) => new(value is null ? Null : new LiteralExpression(value));
        public static StringSnippet LiteralU8(string value) => new(new UnaryOperatorExpression("u8", new LiteralExpression(value), true));

        public static BoolSnippet GreaterThan(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression(">", left, right));
        public static BoolSnippet LessThan(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression("<", left, right));
        public static BoolSnippet Equal(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression("==", left, right));
        public static BoolSnippet NotEqual(ValueExpression left, ValueExpression right) => new(new BinaryOperatorExpression("!=", left, right));

        public static BoolSnippet Is(ValueExpression left, ValueExpression right)
            => new(new BinaryOperatorExpression("is", left, right));

        public static BoolSnippet Or(BoolSnippet left, BoolSnippet right) => new(new BinaryOperatorExpression("||", left.Untyped, right.Untyped));
        public static BoolSnippet And(BoolSnippet left, BoolSnippet right) => new(new BinaryOperatorExpression("&&", left.Untyped, right.Untyped));
        public static BoolSnippet Not(BoolSnippet operand) => new(new UnaryOperatorExpression("!", operand, false));

        public static MethodBodyStatement EmptyLine => new EmptyLineStatement();
        public static KeywordStatement Continue => new("continue", null);
        public static KeywordStatement Break => new("break", null);
        public static KeywordStatement Return(ValueExpression expression) => new("return", expression);
        public static KeywordStatement Return() => new("return", null);
        public static KeywordStatement Throw(ValueExpression expression) => new("throw", expression);

        public static EnumerableSnippet InvokeArrayEmpty(CSharpType arrayItemType)
            => new(arrayItemType, new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), new[] { arrayItemType }));

        public static StreamSnippet InvokeFileOpenRead(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenRead), [Literal(filePath)]));
        public static StreamSnippet InvokeFileOpenWrite(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenWrite), [Literal(filePath)]));

        public static MethodBodyStatement InvokeCustomSerializationMethod(string methodName, Utf8JsonWriterSnippet utf8JsonWriter)
            => new InvokeInstanceMethodStatement(null, methodName, utf8JsonWriter);

        public static MethodBodyStatement InvokeCustomBicepSerializationMethod(string methodName, StringBuilderSnippet stringBuilder)
            => new InvokeInstanceMethodStatement(null, methodName, stringBuilder);

        public static MethodBodyStatement InvokeCustomDeserializationMethod(string methodName, JsonPropertySnippet jsonProperty, VariableReferenceSnippet variable)
            => new InvokeStaticMethodStatement(null, methodName, new ValueExpression[] { jsonProperty, new KeywordExpression("ref", variable) });

        public static AssignValueIfNullStatement AssignIfNull(ValueExpression variable, ValueExpression expression) => new(variable, expression);
        public static AssignValueStatement Assign(ValueExpression variable, ValueExpression expression) => new(variable, expression);

        public static MethodBodyStatement AssignOrReturn(ValueExpression? variable, ValueExpression expression)
            => variable != null ? Assign(variable, expression) : Return(expression);

        public static MethodBodyStatement InvokeConsoleWriteLine(ValueExpression expression)
            => new InvokeStaticMethodStatement(typeof(Console), nameof(Console.WriteLine), expression);

        private static BoolSnippet Is<T>(T value, string name, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableRef = new VariableReferenceSnippet(value.Type, declaration);
            variable = factory(variableRef);
            return new(new BinaryOperatorExpression("is", value, new DeclarationExpression(variableRef.Type, variableRef.Declaration, false)));
        }
    }
}
