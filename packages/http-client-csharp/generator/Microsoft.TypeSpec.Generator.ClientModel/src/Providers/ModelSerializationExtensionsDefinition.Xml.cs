// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
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

#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.
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
                    writer.WriteAttributes(readerTyped, True),
                    readerTyped.ReadStartElement(),
                    writeNodeLoop,
                    writer.WriteEndElement(),
                },
                new MethodBodyStatement[]
                {
                    writer.WriteAttributes(readerTyped, True),
                    readerTyped.ReadStartElement(),
                    new WhileStatement(readerTyped.NodeType().NotEqual(new MemberExpression(typeof(XmlNodeType), nameof(XmlNodeType.EndElement))))
                    {
                        writer.WriteNode(readerVar, True)
                    }
                });

            innerUsing.AddRange([readerTyped.MoveToContent(), nameHintBranch]);
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

            var cases = new List<SwitchCaseStatement> { persistableModelCase };

            if (HasFileBinaryContentXmlModel)
            {
                var fileBinaryContentCase = new SwitchCaseStatement(
                    Declare("fileBinaryContent", typeof(FileBinaryContent), out var fileBinaryContentVar),
                    new MethodBodyStatement[]
                    {
                        writer.Invoke(WriteFileBinaryContentMethodName, fileBinaryContentVar).Terminate(),
                        Return()
                    });
                cases.Add(fileBinaryContentCase);
            }

            cases.Add(defaultCase);

            var body = new SwitchStatement(value, cases);

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildWriteFileBinaryContentXmlMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(FileBinaryContent));
            var signature = new MethodSignature(
                Name: WriteFileBinaryContentMethodName,
                Description: null,
                Modifiers: _methodModifiers,
                ReturnType: null,
                ReturnDescription: null,
                Parameters: [_xmlWriterParameter, valueParameter]);

            var writer = _xmlWriterParameter.As<XmlWriter>();
            var value = valueParameter.As<FileBinaryContent>();

            // value.TryComputeLength(out long length)
            var tryComputeLength = value.TryComputeLength(out var lengthVariable);
            var length = lengthVariable.As<long>();

            // length <= int.MaxValue
            var fitsInInt = new BinaryOperatorExpression("<=", length, IntSnippets.MaxValue).As<bool>();

            // value.TryComputeLength(out long length) && length <= int.MaxValue ? (int)length : 0
            var capacityExpression = new TernaryConditionalExpression(
                tryComputeLength.And(fitsInInt),
                length.CastTo(typeof(int)),
                Literal(0));

            var declareCapacity = Declare("capacity", typeof(int), capacityExpression, out var capacity);

            // using MemoryStream stream = new MemoryStream(capacity);
            var declareStream = UsingDeclare(
                "stream",
                typeof(MemoryStream),
                New.Instance<MemoryStream>(capacity),
                out var stream);
            var streamScoped = stream.As<Stream>();

            // value.WriteTo(stream);
            var writeTo = value.WriteTo(streamScoped).Terminate();

            // writer.WriteBase64(stream.GetBuffer(), 0, (int)stream.Position);
            var positionAsInt = streamScoped.Position().CastTo(typeof(int));
            var writeBase64 = writer.WriteBase64(streamScoped.GetBuffer(), Literal(0), positionAsInt);

            var body = new MethodBodyStatement[]
            {
                declareCapacity,
                declareStream,
                writeTo,
                writeBase64,
            };

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }
    }
}
