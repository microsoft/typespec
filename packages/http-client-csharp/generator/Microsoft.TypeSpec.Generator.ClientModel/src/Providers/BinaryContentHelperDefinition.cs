// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Xml;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class BinaryContentHelperDefinition : InternalHelperProvider
    {
        private const string _fromEnumerableName = "FromEnumerable";
        private const string _fromDictionaryName = "FromDictionary";
        private const string _fromObjectName = "FromObject";

        private readonly CSharpType _requestBodyType =
            ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType;

        private readonly MethodSignatureModifiers _methodModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

        protected override string BuildName() => "BinaryContentHelper";

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override IReadOnlyList<CSharpType> BuildBodyDependencyTypes() =>
            [ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition.Type];

        // Clients whose options carry model proxies pass their options so the proxies apply to the items written here.
        // The parameter is optional so existing callers, such as custom code, keep writing with the wire options.
        private static ParameterProvider? CreateOptionsParameter()
            => ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.ToExpression().SupportsModelProxies
                ? new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(ModelReaderWriterOptions), defaultValue: Null)
                : null;

        private static ScopedApi<ModelReaderWriterOptions> GetOptions(ParameterProvider? optionsParameter)
            => optionsParameter?.As<ModelReaderWriterOptions>() ?? ModelSerializationExtensionsSnippets.Wire;

        // options ??= ModelSerializationExtensions.WireOptions;
        private static MethodBodyStatement DefaultOptions(ParameterProvider? optionsParameter)
            => optionsParameter is null
                ? MethodBodyStatement.Empty
                : optionsParameter.Assign(ModelSerializationExtensionsSnippets.Wire, nullCoalesce: true).Terminate();

        private static ParameterProvider[] WithOptions(ParameterProvider? optionsParameter, params ParameterProvider[] parameters)
            => optionsParameter is null ? parameters : [.. parameters, optionsParameter];

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>
            {
                BuildFromEnumerableTMethod(),
                BuildFromEnumerableBinaryDataMethod(),
                BuildFromReadOnlySpanMethod(),
                BuildFromDictionaryTMethod(),
                BuildFromDictionaryBinaryDataMethod(),
                BuildFromObjectMethod(),
                BuildFromBinaryDataMethod()
            };

            if (ScmCodeModelGenerator.Instance.InputLibrary.HasXmlModelSerialization)
            {
                methods.Add(BuildFromEnumerableXmlMethod());
            }

            return [.. methods];
        }

        private MethodProvider BuildFromEnumerableTMethod()
        {
            var enumerableTType = typeof(IEnumerable<>);
            CSharpType tType = enumerableTType.GetGenericArguments()[0];
            var enumerableParameter = new ParameterProvider("enumerable", FormattableStringHelpers.Empty, enumerableTType);
            var optionsParameter = CreateOptionsParameter();
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: WithOptions(optionsParameter, enumerableParameter),
                ReturnType: _requestBodyType,
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                DefaultOptions(optionsParameter),
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteStartArray(),
                new ForEachStatement("item", enumerableParameter.As(enumerableParameter.Type), out var item)
                {
                    writer.WriteObjectValue(item.As(tType), GetOptions(optionsParameter))
                },
                writer.WriteEndArray(),
                MethodBodyStatement.EmptyLine,
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromEnumerableBinaryDataMethod()
        {
            var enumerableParameter = new ParameterProvider("enumerable", FormattableStringHelpers.Empty, typeof(IEnumerable<BinaryData>));
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: [enumerableParameter],
                ReturnType: _requestBodyType,
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteStartArray(),
                new ForEachStatement("item", enumerableParameter.As<IEnumerable<BinaryData>>(), out var item)
                {
                    new IfElseStatement(
                        item.Equal(Null),
                        writer.WriteNullValue(),
                        writer.WriteBinaryData(item))
                },
                writer.WriteEndArray(),
                MethodBodyStatement.EmptyLine,
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromReadOnlySpanMethod()
        {
            var spanType = typeof(ReadOnlySpan<>);
            CSharpType tType = spanType.GetGenericArguments()[0];
            var spanParameter = new ParameterProvider("span", FormattableStringHelpers.Empty, spanType);
            var optionsParameter = CreateOptionsParameter();
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: WithOptions(optionsParameter, spanParameter),
                ReturnType: _requestBodyType,
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                DefaultOptions(optionsParameter),
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteStartArray(),
                Declare("i", Int(0), out var i),
                new ForStatement(null, i.LessThan(spanParameter.Property(nameof(ReadOnlySpan<byte>.Length))), i.Increment())
                {
                    writer.WriteObjectValue(new IndexerExpression(spanParameter, i).As(tType), GetOptions(optionsParameter))
                },
                writer.WriteEndArray(),
                MethodBodyStatement.EmptyLine,
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromDictionaryTMethod()
        {
            var dictionaryTType = typeof(IDictionary<,>);
            CSharpType valueType = dictionaryTType.GetGenericArguments()[1];
            var dictionaryParameter = new ParameterProvider("dictionary", FormattableStringHelpers.Empty, new CSharpType(dictionaryTType, typeof(string), valueType));
            var optionsParameter = CreateOptionsParameter();
            var signature = new MethodSignature(
                Name: _fromDictionaryName,
                Modifiers: _methodModifiers,
                Parameters: WithOptions(optionsParameter, dictionaryParameter),
                ReturnType: _requestBodyType,
                GenericArguments: [valueType],
                GenericParameterConstraints: [Where.NotNull(valueType)],
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                DefaultOptions(optionsParameter),
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteStartObject(),
                new ForEachStatement("item", dictionaryParameter.As(dictionaryParameter.Type), out var item)
                {
                    writer.WritePropertyName(item.Property("Key")),
                    writer.WriteObjectValue(item.Property("Value").As(valueType), GetOptions(optionsParameter))
                },
                writer.WriteEndObject(),
                MethodBodyStatement.EmptyLine,
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromDictionaryBinaryDataMethod()
        {
            var dictionaryParameter = new ParameterProvider("dictionary", FormattableStringHelpers.Empty, typeof(IDictionary<string, BinaryData>));
            var signature = new MethodSignature(
                Name: _fromDictionaryName,
                Modifiers: _methodModifiers,
                Parameters: [dictionaryParameter],
                ReturnType: _requestBodyType,
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteStartObject(),
                new ForEachStatement("item", dictionaryParameter.As(dictionaryParameter.Type), out var item)
                {
                    writer.WritePropertyName(item.Property("Key")),
                    new IfElseStatement(
                        item.Property("Value").Equal(Null),
                        writer.WriteNullValue(),
                        writer.WriteBinaryData(item.Property("Value")))
                },
                writer.WriteEndObject(),
                MethodBodyStatement.EmptyLine,
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromObjectMethod()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(object));
            var signature = new MethodSignature(
                Name: _fromObjectName,
                Modifiers: _methodModifiers,
                Parameters: [valueParameter],
                ReturnType: _requestBodyType,
                Description: null,
                ReturnDescription: null);

            MethodBodyStatement[] body =
            [
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content),
                ScmCodeModelGenerator.Instance.TypeFactory.SerializeJsonValue(typeof(object), valueParameter, content.JsonWriter(), ModelSerializationExtensionsSnippets.Wire, SerializationFormat.Default),
                Return(content)
            ];

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromBinaryDataMethod()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(BinaryData));
            var signature = new MethodSignature(
                Name: _fromObjectName,
                Modifiers: _methodModifiers,
                Parameters: [valueParameter],
                ReturnType: _requestBodyType,
                Description: null,
                ReturnDescription: null);

            var body = new List<MethodBodyStatement>
            {
                Declare("content", New.Instance<Utf8JsonBinaryContentDefinition>(), out var content)
            };
            var writer = content.JsonWriter();
            body.AddRange(
            [
                writer.WriteBinaryData(valueParameter),
                Return(content)
            ]);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildFromEnumerableXmlMethod()
        {
            var enumerableTType = typeof(IEnumerable<>);
            CSharpType tType = enumerableTType.GetGenericArguments()[0];
            var enumerableParameter = new ParameterProvider("enumerable", FormattableStringHelpers.Empty, enumerableTType);
            var rootNameHintParameter = new ParameterProvider("rootNameHint", FormattableStringHelpers.Empty, typeof(string));
            var childNameHintParameter = new ParameterProvider("childNameHint", FormattableStringHelpers.Empty, typeof(string));
            var optionsParameter = CreateOptionsParameter();
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: WithOptions(optionsParameter, enumerableParameter, rootNameHintParameter, childNameHintParameter),
                ReturnType: _requestBodyType,
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
                Description: null,
                ReturnDescription: null);

            var outerUsing = new UsingScopeStatement(typeof(MemoryStream), "stream", New.Instance(typeof(MemoryStream), Int(256)), out var streamVar);
            var innerUsing = new UsingScopeStatement(typeof(XmlWriter), "writer",
                XmlWriterSnippets.Create(streamVar, ModelSerializationExtensionsSnippets.XmlWriterSettings), out var writerVar);
            var xmlWriter = writerVar.As<XmlWriter>();

            innerUsing.AddRange([
                xmlWriter.WriteStartElement(rootNameHintParameter),
                new ForEachStatement("item", enumerableParameter.As(enumerableParameter.Type), out var item)
                {
                    xmlWriter.WriteObjectValue(item.As(tType), GetOptions(optionsParameter), childNameHintParameter)
                },
                xmlWriter.WriteEndElement(),
            ]);
            outerUsing.AddRange([
                innerUsing,
                MethodBodyStatement.EmptyLine,
                new IfElseStatement(
                    streamVar.Property(nameof(MemoryStream.Position)).GreaterThan(new MemberExpression(typeof(int), nameof(int.MaxValue))),
                    Return(RequestContentApiSnippets.Create(BinaryDataSnippets.FromStream(streamVar, false))),
                    Return(RequestContentApiSnippets.Create(New.Instance(typeof(BinaryData),
                        streamVar.Invoke(nameof(MemoryStream.GetBuffer)).Invoke(nameof(System.MemoryExtensions.AsMemory),
                            [Int(0), streamVar.Property(nameof(MemoryStream.Position)).CastTo(typeof(int))])))))
            ]);

            var body = new MethodBodyStatement[] { DefaultOptions(optionsParameter), outerUsing };

            return new MethodProvider(signature, body, this);
        }
    }
}
