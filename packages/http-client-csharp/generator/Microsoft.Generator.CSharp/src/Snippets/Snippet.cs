// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        private class PrivateEmptyLineStatement : MethodBodyStatement
        {
            internal override void Write(CodeWriter writer)
            {
                writer.WriteLine();
            }
        }

        public static readonly MethodBodyStatement EmptyStatement = new();
        public static readonly MethodBodyStatement EmptyLineStatement = new PrivateEmptyLineStatement();

        public static ValueExpression Identifier(string name) => new MemberExpression(null, name);
        public static MethodBodyStatement AsStatement(this IEnumerable<MethodBodyStatement> statements) => statements.ToArray();

        public static ValueExpression Dash { get; } = new KeywordExpression("_", null);

        public static ValueExpression DefaultOf(CSharpType type) => type is { IsValueType: true, IsNullable: false } ? Default.CastTo(type) : Null.CastTo(type);

        public static ValueExpression Value { get; } = new KeywordExpression("value", null);
        public static ValueExpression Default { get; } = new KeywordExpression("default", null);
        public static ValueExpression Null { get; } = new KeywordExpression("null", null);
        public static ValueExpression This { get; } = new KeywordExpression("this", null);
        public static ValueExpression Base { get; } = new KeywordExpression("base", null);
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

        public static MethodBodyStatement Continue => new KeywordExpression("continue", null).Terminate();
        public static MethodBodyStatement Break => new KeywordExpression("break", null).Terminate();
        public static MethodBodyStatement Return(ValueExpression expression) => new KeywordExpression("return", expression).Terminate();
        public static MethodBodyStatement Return() => new KeywordExpression("return", null).Terminate();
        public static MethodBodyStatement Throw(ValueExpression expression) => new KeywordExpression("throw", expression).Terminate();

        public static EnumerableSnippet InvokeArrayEmpty(CSharpType arrayItemType)
            => new(arrayItemType, new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), new[] { arrayItemType }));

        public static StreamSnippet InvokeFileOpenRead(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenRead), [Literal(filePath)]));
        public static StreamSnippet InvokeFileOpenWrite(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(System.IO.File), nameof(System.IO.File.OpenWrite), [Literal(filePath)]));

        public static AssignmentExpression Assign(this ValueExpression to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this ParameterProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this FieldProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this TypedSnippet to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);
        public static AssignmentExpression Assign(this PropertyProvider to, ValueExpression value, bool nullCoalesce = false) => new AssignmentExpression(to, value, nullCoalesce);

        public static MethodBodyStatement AssignOrReturn(ValueExpression? variable, ValueExpression expression)
            => variable != null ? variable.Assign(expression).Terminate() : Return(expression);

        public static MethodBodyStatement InvokeConsoleWriteLine(ValueExpression expression)
            => new InvokeStaticMethodExpression(typeof(Console), nameof(Console.WriteLine), expression).Terminate();

        public static MethodBodyStatement Increment(ValueExpression value)
            => new UnaryOperatorExpression("++", value, true).Terminate();

        private static BoolSnippet Is<T>(T value, string name, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableRef = new VariableExpression(value.Type, declaration);
            variable = factory(variableRef);
            return new(new BinaryOperatorExpression("is", value, new DeclarationExpression(variableRef)));
        }
    }
}
