// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Xml;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal sealed class TypeFormattersDefinition : TypeProvider
    {
        private readonly ValueExpression _invariantCultureExpression = new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture));
        private const string ToStringMethodName = "ToString";
        private const string ToBase64UrlStringMethodName = "ToBase64UrlString";
        private const string FromBase64UrlStringMethodName = "FromBase64UrlString";
        private const string ParseDateTimeOffsetMethodName = "ParseDateTimeOffset";
        private const string ParseTimeSpanMethodName = "ParseTimeSpan";
        private const string ConvertToStringMethodName = "ConvertToString";

        internal TypeFormattersDefinition()
        {
            _roundtripZFormatField = new(FieldModifiers.Private | FieldModifiers.Const, typeof(string), "RoundtripZFormat", this, initializationValue: Literal("yyyy-MM-ddTHH:mm:ss.fffffffZ"));
            _defaultNumberFormatField = new(FieldModifiers.Public | FieldModifiers.Const, typeof(string), "DefaultNumberFormat", this, initializationValue: Literal("G"));
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "TypeFormatters";

        private readonly FieldProvider _roundtripZFormatField;
        private readonly FieldProvider _defaultNumberFormatField;

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
            var toStringBool = new MethodProvider(
                boolSignature,
                new TernaryConditionalExpression(boolValueParameter, Literal("true"), Literal("false")),
                this);

            var dateTimeParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTime));
            var formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string));
            var dateTimeSignature = new MethodSignature(
                Name: ToStringMethodName,
                Parameters: [dateTimeParameter, formatParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);

            var dateTimeValue = (ValueExpression)dateTimeParameter;
            var dateTimeValueKind = dateTimeValue.Property(nameof(DateTime.Kind));
            var sdkName = "Generated clients require";
            var toStringDateTime = new MethodProvider(
                dateTimeSignature,
                new SwitchExpression(dateTimeValueKind,
                [
                    new(new MemberExpression(typeof(DateTimeKind), nameof(DateTimeKind.Utc)), TypeFormattersSnippets.ToString(dateTimeValue.CastTo(typeof(DateTimeOffset)), formatParameter)),
                    SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(new FormattableStringExpression($"DateTime {{0}} has a Kind of {{1}}. {sdkName} it to be UTC. You can call DateTime.SpecifyKind to change Kind property value to DateTimeKind.Utc.", [dateTimeValue, dateTimeValueKind]))))
                ]),
                this);

            var dateTimeOffsetParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTimeOffset));
            var dateTimeOffsetSignature = new MethodSignature(
                Name: ToStringMethodName,
                Parameters: [dateTimeOffsetParameter, formatParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);

            var dateTimeOffsetValue = dateTimeOffsetParameter.As<DateTimeOffset>();
            var toStringDateTimeOffset = new MethodProvider(
                dateTimeOffsetSignature,
                new SwitchExpression(formatParameter,
                [
                    new(Literal("D"), dateTimeOffsetValue.InvokeToString(Literal("yyyy-MM-dd"), _invariantCultureExpression)),
                    new(Literal("U"), dateTimeOffsetValue.ToUnixTimeSeconds().InvokeToString(_invariantCultureExpression)),
                    new(Literal("O"), dateTimeOffsetValue.ToUniversalTime().InvokeToString(_roundtripZFormatField, _invariantCultureExpression)),
                    new(Literal("o"), dateTimeOffsetValue.ToUniversalTime().InvokeToString(_roundtripZFormatField, _invariantCultureExpression)),
                    new(Literal("R"), dateTimeOffsetValue.InvokeToString(Literal("r"), _invariantCultureExpression)),
                    SwitchCaseExpression.Default(dateTimeOffsetValue.InvokeToString(formatParameter, _invariantCultureExpression))
                ]),
                this);

            var timeSpanParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(TimeSpan));
            var timeSpanSignature = new MethodSignature(
                Name: ToStringMethodName,
                Parameters: [timeSpanParameter, formatParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);

            var toStringTimeSpan = new MethodProvider(
                timeSpanSignature,
                new SwitchExpression(formatParameter,
                [
                    new(Literal("P"), Static<XmlConvert>().Invoke(nameof(XmlConvert.ToString), [timeSpanParameter])),
                    SwitchCaseExpression.Default(timeSpanParameter.As<TimeSpan>().InvokeToString(formatParameter, _invariantCultureExpression))
                ]),
                this);

            var byteArrayParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(byte[]));
            var byteArraySignature = new MethodSignature(
                Name: ToStringMethodName,
                Parameters: [byteArrayParameter, formatParameter],
                Modifiers: _methodModifiers,
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);
            var byteArrayValue = (ValueExpression)byteArrayParameter;
            var toStringByteArray = new MethodProvider(
                byteArraySignature,
                new SwitchExpression(formatParameter,
                [
                    new(Literal("U"), TypeFormattersSnippets.ToBase64UrlString(byteArrayValue.As<byte[]>())),
                    new(Literal("D"), Static(typeof(Convert)).Invoke(nameof(Convert.ToBase64String), [byteArrayValue])),
                    SwitchCaseExpression.Default(ThrowExpression(New.ArgumentException(formatParameter, new FormattableStringExpression("Format is not supported: '{0}'", [formatParameter]))))
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

            var valueLength = value.Property("Length").As<int>();
            var body = new List<MethodBodyStatement>
            {
                Declare("numWholeOrPartialInputBlocks", Checked(valueLength.Add(Int(2))).DivideBy(Int(3)).As<int>(), out var numWholeOrPartialInputBlocks),
                Declare("size", Checked(numWholeOrPartialInputBlocks.As<int>().Multiply(Int(4))), out var size),
            };
            var outputVar = new VariableExpression(typeof(char[]), "output");
            var output = new IndexableExpression(outputVar);
            body.Add(new MethodBodyStatement[]
            {
                Declare(outputVar, New.Array(typeof(char), size)),
                MethodBodyStatement.EmptyLine,
                Declare("numBase64Chars", Static(typeof(Convert)).Invoke(nameof(Convert.ToBase64CharArray), [value, Int(0), valueLength, output, Int(0)]).As<int>(), out var numBase64Chars),
                MethodBodyStatement.EmptyLine,
                Declare("i", Int(0), out var i),
                new ForStatement(null, i.LessThan(numBase64Chars), i.Increment())
                {
                    Declare("ch", output[i].As<char>(), out var ch),
                    new IfElseStatement(new IfStatement(ch.Equal(Literal('+')))
                    {
                        output[i].Assign(Literal('-')).Terminate()
                    }, new IfElseStatement(new IfStatement(ch.Equal(Literal('/')))
                    {
                        output[i].Assign(Literal('_')).Terminate()
                    }, new IfStatement(ch.Equal(Literal('=')))
                    {
                        Break
                    }))
                },
                MethodBodyStatement.EmptyLine,
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

            var body = new List<MethodBodyStatement>
            {
                Declare("paddingCharsToAdd", new SwitchExpression(new BinaryOperatorExpression("%", valueParameter.As<string>().Length(), Literal(4)),
                [
                    new SwitchCaseExpression(Int(0), Int(0)),
                    new SwitchCaseExpression(Int(2), Int(2)),
                    new SwitchCaseExpression(Int(3), Int(1)),
                    SwitchCaseExpression.Default(ThrowExpression(New.InvalidOperationException(Literal("Malformed input"))))
                ]).As<int>(), out var paddingCharsToAdd)
            };
            var outputVar = new VariableExpression(typeof(char[]), "output");
            var output = new IndexableExpression(outputVar);
            var outputLength = output.Property("Length");
            body.Add(new MethodBodyStatement[]
            {
                Declare(outputVar, New.Array(typeof(char), valueParameter.As<string>().Length().Add(paddingCharsToAdd.As<int>()))),
                Declare("i", Int(0), out var i),
                new ForStatement(null, i.LessThan(valueParameter.As<string>().Length()), i.Increment())
                {
                    Declare("ch", valueParameter.As<string>().Index(i), out var ch),
                    new IfElseStatement(new IfStatement(ch.Equal(Literal('-')))
                    {
                        output[i].Assign(Literal('+')).Terminate()
                    }, new IfElseStatement(new IfStatement(ch.Equal(Literal('_')))
                    {
                        output[i].Assign(Literal('/')).Terminate()
                    }, output[i].Assign(ch).Terminate()))
                },
                MethodBodyStatement.EmptyLine,
                new ForStatement(null, i.LessThan(outputLength), i.Increment())
                {
                    output[i].Assign(Literal('=')).Terminate()
                },
                MethodBodyStatement.EmptyLine,
                Return(Static(typeof(Convert)).Invoke(nameof(Convert.FromBase64CharArray), [output, Int(0), outputLength]))
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
                Parameters: [valueParameter, formatParameter],
                ReturnType: typeof(DateTimeOffset),
                Description: null, ReturnDescription: null);

            var invariantCulture = new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture));
            return new MethodProvider(
                signature,
                new SwitchExpression(formatParameter,
                [
                    new(Literal("U"), DateTimeOffsetSnippets.FromUnixTimeSeconds(LongSnippets.Parse(valueParameter, invariantCulture))),
                    SwitchCaseExpression.Default(DateTimeOffsetSnippets.Parse(valueParameter, invariantCulture, new MemberExpression(typeof(DateTimeStyles), nameof(DateTimeStyles.AssumeUniversal))))
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

            return new MethodProvider(
                signature,
                new SwitchExpression(formatParameter,
                [
                    new(Literal("P"), Static(typeof(XmlConvert)).Invoke(nameof(XmlConvert.ToTimeSpan), [valueParameter])),
                    SwitchCaseExpression.Default(TimeSpanSnippets.ParseExact(valueParameter, formatParameter, new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture))))
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
                Parameters: [valueParameter, formatParameter],
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);

            var value = (ValueExpression)valueParameter;
            var body = new SwitchExpression(value,
            [
                new SwitchCaseExpression(Null, Literal("null")),
                new SwitchCaseExpression(new DeclarationExpression(typeof(string), "s", out var s), s),
                new SwitchCaseExpression(new DeclarationExpression(typeof(bool), "b", out var b), TypeFormattersSnippets.ToString(b)),
                new SwitchCaseExpression(GetTypePattern([typeof(int),typeof(float), typeof(double), typeof(long), typeof(decimal)]), value.CastTo(typeof(IFormattable)).Invoke(nameof(IFormattable.ToString), _defaultNumberFormatField, _invariantCultureExpression)),
                // TODO -- figure out how to write this line
                SwitchCaseExpression.When(new DeclarationExpression(typeof(byte[]), "b", out var bytes), formatParameter.NotEqual(Null), TypeFormattersSnippets.ToString(bytes, formatParameter)),
                new SwitchCaseExpression(new DeclarationExpression(typeof(IEnumerable<string>), "s", out var enumerable), StringSnippets.Join(Literal(","), enumerable)),
                SwitchCaseExpression.When(new DeclarationExpression(typeof(DateTimeOffset), "dateTime", out var dateTime), formatParameter.NotEqual(Null), TypeFormattersSnippets.ToString(dateTime, formatParameter)),
                SwitchCaseExpression.When(new DeclarationExpression(typeof(TimeSpan), "timeSpan", out var timeSpan), formatParameter.NotEqual(Null), TypeFormattersSnippets.ToString(timeSpan, formatParameter)),
                new SwitchCaseExpression(new DeclarationExpression(typeof(TimeSpan), "timeSpan", out var timeSpanNoFormat), Static<XmlConvert>().Invoke(nameof(XmlConvert.ToString), [timeSpanNoFormat])),
                new SwitchCaseExpression(new DeclarationExpression(typeof(Guid), "guid", out var guid), guid.Invoke("ToString")),
                new SwitchCaseExpression(new DeclarationExpression(typeof(BinaryData), "binaryData", out var binaryData), TypeFormattersSnippets.ConvertToString(binaryData.As<BinaryData>().ToArray(), formatParameter)),
                SwitchCaseExpression.Default(value.InvokeToString())
            ]);

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
