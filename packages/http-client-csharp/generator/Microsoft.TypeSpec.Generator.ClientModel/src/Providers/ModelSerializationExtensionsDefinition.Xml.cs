// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Xml;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed partial class ModelSerializationExtensionsDefinition
    {
        private const string XmlWriterSettingsFieldName = "XmlWriterSettings";
        private const string XmlReaderSettingsFieldName = "XmlReaderSettings";

        private readonly ParameterProvider _xElementParameter =
            new("element", FormattableStringHelpers.Empty, typeof(XElement));

        private readonly ParameterProvider _xmlWriterParameter =
            new("writer", FormattableStringHelpers.Empty, typeof(XmlWriter));

        private FieldProvider _xmlWriterSettingsField;
        private FieldProvider _xmlReaderSettingsField;

        private FieldProvider[] BuildXmlFields()
        {
            if (!ScmCodeModelGenerator.Instance.InputLibrary.HasXmlModelSerialization)
            {
                return [];
            }

            return [_xmlWriterSettingsField, _xmlReaderSettingsField];
        }

        private MethodProvider[] BuildXmlExtensionMethods()
        {
            if (!ScmCodeModelGenerator.Instance.InputLibrary.HasXmlModelSerialization)
            {
                return [];
            }

            return
            [
                BuildXmlGetDateTimeOffsetMethodProvider(),
                BuildXmlGetTimeSpanMethodProvider(),
                BuildXmlGetBytesFromBase64MethodProvider(),
                BuildXmlWriteStringValueDateTimeOffsetMethodProvider(),
                BuildXmlWriteStringValueTimeSpanMethodProvider(),
                BuildXmlWriteBase64StringValueMethodProvider(),
                BuildXmlWriteObjectValueMethodProvider()
            ];
        }

        private MethodProvider BuildXmlGetDateTimeOffsetMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getDateTimeOffsetMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(DateTimeOffset),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = new SwitchExpression(
                _formatParameter,
                new SwitchCaseExpression(Literal("U"), DateTimeOffsetSnippets.FromUnixTimeSeconds(element.CastTo(typeof(long)))),
                SwitchCaseExpression.Default(TypeFormattersSnippets.ParseDateTimeOffset(element.Value(), _formatParameter)));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlGetTimeSpanMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getTimeSpanMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(TimeSpan),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = TypeFormattersSnippets.ParseTimeSpan(element.Value(), _formatParameter);

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlGetBytesFromBase64MethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getBytesFromBase64MethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(byte[]),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = new SwitchExpression(
                _formatParameter,
                new SwitchCaseExpression(Literal("U"), TypeFormattersSnippets.FromBase64UrlString(element.Value())),
                new SwitchCaseExpression(Literal("D"), Static(typeof(Convert)).Invoke(nameof(Convert.FromBase64String), element.Value())),
                SwitchCaseExpression.Default(ThrowExpression(New.ArgumentException(_formatParameter, Literal("Format is not supported: "), true))));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlWriteStringValueDateTimeOffsetMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTimeOffset));
            var signature = new MethodSignature(
                Name: WriteStringValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xmlWriterParameter, valueParameter, _formatParameter],
                ReturnType: null,
                Description: null,
                ReturnDescription: null);

            var writer = _xmlWriterParameter.As<XmlWriter>();
            var body = writer.WriteValue(TypeFormattersSnippets.ToString(valueParameter, _formatParameter));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlWriteStringValueTimeSpanMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(TimeSpan));
            var signature = new MethodSignature(
                Name: WriteStringValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xmlWriterParameter, valueParameter, _formatParameter],
                ReturnType: null,
                Description: null,
                ReturnDescription: null);

            var writer = _xmlWriterParameter.As<XmlWriter>();
            var body = writer.WriteValue(TypeFormattersSnippets.ToString(valueParameter, _formatParameter));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlWriteBase64StringValueMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(byte[]));
            var signature = new MethodSignature(
                Name: WriteBase64StringValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xmlWriterParameter, valueParameter, _formatParameter],
                ReturnType: null,
                Description: null,
                ReturnDescription: null);

            var writer = _xmlWriterParameter.As<XmlWriter>();
            var body = writer.WriteValue(TypeFormattersSnippets.ToString(valueParameter, _formatParameter));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlWriteObjectValueMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, _t);
            var optionsParameter = new ParameterProvider(
                "options",
                FormattableStringHelpers.Empty,
                new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true),
                DefaultOf(new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true)));
            var nameHintParameter = new ParameterProvider(
                "nameHint",
                FormattableStringHelpers.Empty,
                new CSharpType(typeof(string), isNullable: true),
                DefaultOf(new CSharpType(typeof(string), isNullable: true)));

            var signature = new MethodSignature(
                Name: WriteObjectValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xmlWriterParameter, valueParameter, optionsParameter, nameHintParameter],
                ReturnType: null,
                GenericArguments: [_t],
                Description: null,
                ReturnDescription: null);

            var writer = _xmlWriterParameter.As<XmlWriter>();
            ValueExpression value = valueParameter;
            ValueExpression options = optionsParameter;
            ValueExpression nameHint = nameHintParameter;

            // Build the switch statement
            var persistableModelType = new CSharpType(typeof(IPersistableModel<>), _t);
            var dataVar = new VariableExpression(typeof(BinaryData), "data");

            // Create outer using scope to capture streamVar
            var outerUsing = new UsingScopeStatement(typeof(Stream), "stream", dataVar.As<BinaryData>().ToStream(), out var streamVar);

            // Create inner using scope to capture readerVar
            var innerUsing = new UsingScopeStatement(
                typeof(XmlReader),
                "reader",
                XmlReaderSnippets.Create(streamVar, new MemberExpression(null, XmlReaderSettingsFieldName)),
                out var readerVar);

            var readerTyped = readerVar.As<XmlReader>();
            var writeNodeLoop = new WhileStatement(readerTyped.NodeType().NotEqual(new MemberExpression(typeof(XmlNodeType), nameof(XmlNodeType.EndElement))))
            {
                writer.WriteNode(readerVar, True)
            };

            var nameHintBranch = new IfElseStatement(
                nameHint.NotEqual(Null),
                new MethodBodyStatement[]
                {
                    writer.WriteStartElement(nameHint),
                    readerTyped.ReadStartElement(),
                    writeNodeLoop,
                    writer.WriteEndElement(),
                },
                new MethodBodyStatement[]
                {
                    readerTyped.ReadStartElement(),
                    new WhileStatement(readerTyped.NodeType().NotEqual(new MemberExpression(typeof(XmlNodeType), nameof(XmlNodeType.EndElement))))
                    {
                        writer.WriteNode(readerVar, True)
                    }
                });

            innerUsing.Add(readerTyped.MoveToContent());
            innerUsing.Add(nameHintBranch);
            outerUsing.Add(innerUsing);

            var persistableModelCase = new SwitchCaseStatement(
                Declare("persistableModel", persistableModelType, out var persistableModelVar),
                new MethodBodyStatement[]
                {
                    Declare(
                        dataVar,
                        Static(typeof(ModelReaderWriter)).Invoke(
                            nameof(ModelReaderWriter.Write),
                            [
                                persistableModelVar,
                                options.NullCoalesce(ModelSerializationExtensionsSnippets.Wire),
                                ModelReaderWriterContextSnippets.Default
                            ])),
                    outerUsing,
                    Return()
                });

            var defaultCase = SwitchCaseStatement.Default(
                Throw(New.NotSupportedException(new FormattableStringExpression("Not supported type {0}", [new TypeOfExpression(_t)]))));

            var body = new SwitchStatement(value, [persistableModelCase, defaultCase]);

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }
    }
}
