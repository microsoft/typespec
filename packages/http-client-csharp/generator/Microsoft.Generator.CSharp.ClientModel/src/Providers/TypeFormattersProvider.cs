// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Xml;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using static Microsoft.Generator.CSharp.ClientModel.Snippets.TypeFormattersSnippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal sealed class TypeFormattersProvider : TypeProvider
    {
        private readonly ValueExpression _invariantCultureExpression = new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture));
        private const string ToStringMethodName = "ToString";
        private const string ToBase64UrlStringMethodName = "ToBase64UrlString";
        private const string FromBase64UrlStringMethodName = "FromBase64UrlString";
        private const string ParseDateTimeOffsetMethodName = "ParseDateTimeOffset";
        private const string ParseTimeSpanMethodName = "ParseTimeSpan";
        private const string ConvertToStringMethodName = "ConvertToString";

        internal TypeFormattersProvider()
        {
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        public override string Name => "TypeFormatters";

        private readonly FieldProvider _roundtripZFormatField = new(FieldModifiers.Private | FieldModifiers.Const, typeof(string), "RoundtripZFormat", initializationValue: Literal("yyyy-MM-ddTHH:mm:ss.fffffffZ"));
        private readonly FieldProvider _defaultNumberFormatField = new(FieldModifiers.Public | FieldModifiers.Const, typeof(string), "DefaultNumberFormat", initializationValue: Literal("G"));

        protected override FieldProvider[] BuildFields()
        {
            return [_roundtripZFormatField, _defaultNumberFormatField];
        }

        private readonly MethodSignatureModifiers _methodModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

        protected override MethodProvider[] BuildMethods()
        {
            var boolValueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(bool));
            var boolSignature = new MethodSignature(
                Name: ToStringMethodName,
                Parameters: [boolValueParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);
            var boolValue = new BoolSnippet(boolValueParameter);
            var toStringBool = new MethodProvider(
                boolSignature,
                new TernaryConditionalExpression(boolValue, Literal("true"), Literal("false")),
                this);

            var dateTimeParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTime));
            var formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string));
            var dateTimeSignature = boolSignature with
            {
                Parameters = [dateTimeParameter, formatParameter]
            };
            var dateTimeValue = (ValueExpression)dateTimeParameter;
            var dateTimeValueKind = dateTimeValue.Property(nameof(DateTime.Kind));
            var format = new StringSnippet(formatParameter);
            var sdkName = "Generated clients require";
            var toStringDateTime = new MethodProvider(
                dateTimeSignature,
                new SwitchExpression(dateTimeValueKind, new SwitchCaseExpression[]
                {
                    new(new MemberExpression(typeof(DateTimeKind), nameof(DateTimeKind.Utc)), TypeFormattersSnippet.ToString(dateTimeValue.CastTo(typeof(DateTimeOffset)), format)),
                    SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(new FormattableStringExpression($"DateTime {{0}} has a Kind of {{1}}. {sdkName} it to be UTC. You can call DateTime.SpecifyKind to change Kind property value to DateTimeKind.Utc.", [dateTimeValue, dateTimeValueKind]))))
                }),
                this);

            var dateTimeOffsetParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTimeOffset));
            var dateTimeOffsetSignature = boolSignature with
            {
                Parameters = [dateTimeOffsetParameter, formatParameter]
            };
            var dateTimeOffsetValue = new DateTimeOffsetSnippet(dateTimeOffsetParameter);
            var roundtripZFormat = new StringSnippet(_roundtripZFormatField);
            var toStringDateTimeOffset = new MethodProvider(
                dateTimeOffsetSignature,
                new SwitchExpression(format,
                [
                    new(Literal("D"), dateTimeOffsetValue.InvokeToString(Literal("yyyy-MM-dd"), _invariantCultureExpression)),
                    new(Literal("U"), dateTimeOffsetValue.ToUnixTimeSeconds().InvokeToString(_invariantCultureExpression)),
                    new(Literal("O"), dateTimeOffsetValue.ToUniversalTime().InvokeToString(roundtripZFormat, _invariantCultureExpression)),
                    new(Literal("o"), dateTimeOffsetValue.ToUniversalTime().InvokeToString(roundtripZFormat, _invariantCultureExpression)),
                    new(Literal("R"), dateTimeOffsetValue.InvokeToString(Literal("r"), _invariantCultureExpression)),
                    SwitchCaseExpression.Default(dateTimeOffsetValue.InvokeToString(format, _invariantCultureExpression))
                ]),
                this);

            var timeSpanParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(TimeSpan));
            var timeSpanSignature = boolSignature with
            {
                Parameters = [timeSpanParameter, formatParameter]
            };
            var timeSpanValue = new TimeSpanSnippet(timeSpanParameter);
            var toStringTimeSpan = new MethodProvider(
                timeSpanSignature,
                new SwitchExpression(format,
                [
                    new(Literal("P"), new InvokeStaticMethodExpression(typeof(XmlConvert), nameof(XmlConvert.ToString), [timeSpanValue])),
                    SwitchCaseExpression.Default(timeSpanValue.InvokeToString(format, _invariantCultureExpression))
                ]),
                this);

            var byteArrayParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(byte[]));
            var byteArraySignature = boolSignature with
            {
                Parameters = [byteArrayParameter, formatParameter]
            };
            var byteArrayValue = (ValueExpression)byteArrayParameter;
            var toStringByteArray = new MethodProvider(
                byteArraySignature,
                new SwitchExpression(format,
                [
                    new(Literal("U"), ToBase64UrlString(byteArrayValue)),
                    new(Literal("D"), new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToBase64String), new[] {byteArrayValue})),
                    SwitchCaseExpression.Default(ThrowExpression(New.ArgumentException(format, new FormattableStringExpression("Format is not supported: '{0}'", [format]))))
                ]),
                this);

            return
            [
                toStringBool,
                toStringDateTime,
                toStringDateTimeOffset,
                toStringTimeSpan,
                toStringByteArray,
                BuildToBase64UrlStringMethodProvider(),
                BuildFromBase64UrlString(),
                BuildParseDateTimeOffsetMethodProvider(),
                BuildParseTimeSpanMethodProvider(),
                BuildConvertToStringMethodProvider()
            ];
        }

        private MethodProvider BuildToBase64UrlStringMethodProvider()
        {
            var value = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(byte[]));
            var signature = new MethodSignature(
                Name: ToBase64UrlStringMethodName,
                Parameters: [value],
                ReturnType: typeof(string),
                Modifiers: _methodModifiers,
                Description: null, ReturnDescription: null);

            var valueLength = new IntSnippet(value.Property("Length"));
            var body = new List<MethodBodyStatement>
            {
                Declare("numWholeOrPartialInputBlocks", new IntSnippet(new BinaryOperatorExpression("/", new KeywordExpression("checked", new BinaryOperatorExpression("+", valueLength, Int(2))), Int(3))), out var numWholeOrPartialInputBlocks),
                Declare("size", new IntSnippet(new KeywordExpression("checked", new BinaryOperatorExpression("*", numWholeOrPartialInputBlocks, Int(4)))), out var size),
            };
            var output = new VariableExpression(typeof(char[]), "output");
            body.Add(new MethodBodyStatement[]
            {
                Declare(output, New.Array(typeof(char), size)),
                EmptyLineStatement,
                Declare("numBase64Chars", new IntSnippet(new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToBase64CharArray), [value, Int(0), valueLength, output, Int(0)])), out var numBase64Chars),
                EmptyLineStatement,
                Declare("i", Int(0), out var i),
                new ForStatement(null, LessThan(i, numBase64Chars), new UnaryOperatorExpression("++", i, true))
                {
                    Declare("ch", new CharSnippet(new IndexerExpression(output, i)), out var ch),
                    new IfElseStatement(new IfStatement(Equal(ch, Literal('+')))
                    {
                        new IndexerExpression(output, i).Assign(Literal('-')).Terminate()
                    }, new IfElseStatement(new IfStatement(Equal(ch, Literal('/')))
                    {
                        new IndexerExpression(output, i).Assign(Literal('_')).Terminate()
                    }, new IfStatement(Equal(ch, Literal('=')))
                    {
                        Break
                    }))
                },
                EmptyLineStatement,
                Return(New.Instance(typeof(string), output, Int(0), i))
            });

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromBase64UrlString()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(string));
            var signature = new MethodSignature(
                Name: FromBase64UrlStringMethodName,
                Parameters: [valueParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(byte[]),
                Description: null, ReturnDescription: null);
            var value = new StringSnippet(valueParameter);

            var body = new List<MethodBodyStatement>
            {
                Declare("paddingCharsToAdd", new IntSnippet(new SwitchExpression(new BinaryOperatorExpression("%", value.Length, Literal(4)), new SwitchCaseExpression[]
                {
                    new SwitchCaseExpression(Int(0), Int(0)),
                    new SwitchCaseExpression(Int(2), Int(2)),
                    new SwitchCaseExpression(Int(3), Int(1)),
                    SwitchCaseExpression.Default(ThrowExpression(New.InvalidOperationException(Literal("Malformed input"))))
                })), out var paddingCharsToAdd)
            };
            var output = new VariableExpression(typeof(char[]), "output");
            var outputLength = output.Property("Length");
            body.Add(new MethodBodyStatement[]
            {
                Declare(output, New.Array(typeof(char), new BinaryOperatorExpression("+", value.Length, paddingCharsToAdd))),
                Declare("i", Int(0), out var i),
                new ForStatement(null, LessThan(i, value.Length), new UnaryOperatorExpression("++", i, true))
                {
                    Declare("ch", value.Index(i), out var ch),
                    new IfElseStatement(new IfStatement(Equal(ch, Literal('-')))
                    {
                        new IndexerExpression(output, i).Assign(Literal('+')).Terminate()
                    }, new IfElseStatement(new IfStatement(Equal(ch, Literal('_')))
                    {
                        new IndexerExpression(output, i).Assign(Literal('/')).Terminate()
                    }, new IndexerExpression(output, i).Assign(ch).Terminate()))
                },
                EmptyLineStatement,
                new ForStatement(null, LessThan(i, outputLength), new UnaryOperatorExpression("++", i, true))
                {
                    new IndexerExpression(output, i).Assign(Literal('=')).Terminate()
                },
                EmptyLineStatement,
                Return(new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.FromBase64CharArray), new[] { output, Int(0), outputLength }))
            });

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildParseDateTimeOffsetMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(string));
            var formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string), null);
            var signature = new MethodSignature(
                Name: ParseDateTimeOffsetMethodName,
                Modifiers: _methodModifiers,
                Parameters: new[] { valueParameter, formatParameter },
                ReturnType: typeof(DateTimeOffset),
                Description: null, ReturnDescription: null);

            var value = new StringSnippet(valueParameter);
            var format = new StringSnippet(formatParameter);
            var invariantCulture = new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture));
            return new MethodProvider(
                signature,
                new SwitchExpression(format,
                [
                    new(Literal("U"), DateTimeOffsetSnippet.FromUnixTimeSeconds(LongSnippet.Parse(value, invariantCulture))),
                    SwitchCaseExpression.Default(DateTimeOffsetSnippet.Parse(value, invariantCulture, new MemberExpression(typeof(DateTimeStyles), nameof(DateTimeStyles.AssumeUniversal))))
                ]),
                this);
        }

        private MethodProvider BuildParseTimeSpanMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(string));
            var formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string));
            var signature = new MethodSignature(
                Name: ParseTimeSpanMethodName,
                Modifiers: _methodModifiers,
                Parameters: new[] { valueParameter, formatParameter },
                ReturnType: typeof(TimeSpan),
                Description: null, ReturnDescription: null);

            var value = new StringSnippet(valueParameter);
            var format = new StringSnippet(formatParameter);
            return new MethodProvider(
                signature,
                new SwitchExpression(format,
                [
                    new(Literal("P"), new InvokeStaticMethodExpression(typeof(XmlConvert), nameof(XmlConvert.ToTimeSpan), [value])),
                    SwitchCaseExpression.Default(TimeSpanSnippet.ParseExact(value, format, new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture))))
                ]),
                this);
        }

        private MethodProvider BuildConvertToStringMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(object));
            var nullableStringType = new CSharpType(typeof(string), true);
            var formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, nullableStringType, DefaultOf(nullableStringType));
            var signature = new MethodSignature(
                Name: ConvertToStringMethodName,
                Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                Parameters: new[] { valueParameter, formatParameter },
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);

            var value = (ValueExpression)valueParameter;
            var format = new StringSnippet(formatParameter);
            var body = new SwitchExpression(value, new SwitchCaseExpression[]
            {
                new SwitchCaseExpression(Null, Literal("null")),
                new SwitchCaseExpression(new DeclarationExpression(typeof(string), "s", out var s), s),
                new SwitchCaseExpression(new DeclarationExpression(typeof(bool), "b", out var b), TypeFormattersSnippet.ToString(b)),
                new SwitchCaseExpression(GetTypePattern(new CSharpType[] {typeof(int),typeof(float), typeof(double), typeof(long), typeof(decimal)}), value.CastTo(typeof(IFormattable)).Invoke(nameof(IFormattable.ToString), _defaultNumberFormatField, _invariantCultureExpression)),
                // TODO -- figure out how to write this line
                SwitchCaseExpression.When(new DeclarationExpression(typeof(byte[]), "b", out var bytes), NotEqual(format, Null), TypeFormattersSnippet.ToString(bytes, format)),
                new SwitchCaseExpression(new DeclarationExpression(typeof(IEnumerable<string>), "s", out var enumerable), StringSnippet.Join(Literal(","), enumerable)),
                SwitchCaseExpression.When(new DeclarationExpression(typeof(DateTimeOffset), "dateTime", out var dateTime), NotEqual(format, Null), TypeFormattersSnippet.ToString(dateTime, format)),
                SwitchCaseExpression.When(new DeclarationExpression(typeof(TimeSpan), "timeSpan", out var timeSpan), NotEqual(format, Null), TypeFormattersSnippet.ToString(timeSpan, format)),
                new SwitchCaseExpression(new DeclarationExpression(typeof(TimeSpan), "timeSpan", out var timeSpanNoFormat), new InvokeStaticMethodExpression(typeof(XmlConvert), nameof(XmlConvert.ToString), [timeSpanNoFormat])),
                new SwitchCaseExpression(new DeclarationExpression(typeof(Guid), "guid", out var guid), guid.Invoke("ToString")),
                new SwitchCaseExpression(new DeclarationExpression(typeof(BinaryData), "binaryData", out var binaryData), ConvertToString(new BinaryDataSnippet(binaryData).ToArray(), format)),
                SwitchCaseExpression.Default(value.InvokeToString())
            });

            return new(signature, body, this);
        }

        private static ValueExpression GetTypePattern(IReadOnlyList<CSharpType> types)
        {
            ValueExpression result = types[^1];

            for (int i = types.Count - 2; i >= 0; i--)
            {
                result = new BinaryOperatorExpression(" or ", types[i], result); // chain them together
            }

            return result;
        }
    }
}
