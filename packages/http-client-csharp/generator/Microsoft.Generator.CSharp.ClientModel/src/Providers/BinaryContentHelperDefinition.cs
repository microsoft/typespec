// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class BinaryContentHelperDefinition : TypeProvider
    {
        private const string _fromEnumerableName = "FromEnumerable";
        private const string _fromDictionaryName = "FromDictionary";
        private const string _fromObjectName = "FromObject";

        private readonly CSharpType _requestBodyType = typeof(BinaryContent);

        private readonly MethodSignatureModifiers _methodModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

        protected override string BuildName() => "BinaryContentHelper";

        protected override TypeSignatureModifiers GetDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildFromEnumerableTMethod(),
                BuildFromEnumerableBinaryDataMethod(),
                BuildFromReadOnlySpanMethod(),
                BuildFromDictionaryTMethod(),
                BuildFromDictionaryBinaryDataMethod(),
                BuildFromObjectMethod(),
                BuildFromBinaryDataMethod()
            ];
        }

        private MethodProvider BuildFromEnumerableTMethod()
        {
            var enumerableTType = typeof(IEnumerable<>);
            CSharpType tType = enumerableTType.GetGenericArguments()[0];
            var enumerableParameter = new ParameterProvider("enumerable", FormattableStringHelpers.Empty, enumerableTType);
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: [enumerableParameter],
                ReturnType: _requestBodyType,
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
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
                new ForeachStatement("item", enumerableParameter.As(enumerableParameter.Type), out var item)
                {
                    writer.WriteObjectValue(item.As(tType), ModelSerializationExtensionsSnippets.Wire)
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
                new ForeachStatement("item", enumerableParameter.As<IEnumerable<BinaryData>>(), out var item)
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
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: [spanParameter],
                ReturnType: _requestBodyType,
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
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
                Declare("i", Int(0), out var i),
                new ForStatement(null, i.LessThan(spanParameter.Property(nameof(ReadOnlySpan<byte>.Length))), i.Increment())
                {
                    writer.WriteObjectValue(new IndexerExpression(spanParameter, i).As(tType), ModelSerializationExtensionsSnippets.Wire)
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
            var signature = new MethodSignature(
                Name: _fromDictionaryName,
                Modifiers: _methodModifiers,
                Parameters: [dictionaryParameter],
                ReturnType: _requestBodyType,
                GenericArguments: [valueType],
                GenericParameterConstraints: [Where.NotNull(valueType)],
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
                new ForeachStatement("item", dictionaryParameter.As(dictionaryParameter.Type), out var item)
                {
                    writer.WritePropertyName(item.Property("Key")),
                    writer.WriteObjectValue(item.Property("Value").As(valueType), ModelSerializationExtensionsSnippets.Wire)
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
                new ForeachStatement("item", dictionaryParameter.As(dictionaryParameter.Type), out var item)
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
                content.JsonWriter().WriteObjectValue(valueParameter.As<object>(), ModelSerializationExtensionsSnippets.Wire),
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
    }
}
