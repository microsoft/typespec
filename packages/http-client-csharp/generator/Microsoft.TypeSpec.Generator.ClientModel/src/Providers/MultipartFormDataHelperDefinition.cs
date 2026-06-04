// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class MultipartFormDataHelperDefinition : TypeProvider
    {
        private const string _fromEnumerableName = "FromEnumerable";
        private const string _fromDictionaryName = "FromDictionary";
        private const int _initialStreamCapacity = 256;

        private readonly MethodSignatureModifiers _methodModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static;

        protected override string BuildName() => "MultipartFormDataHelper";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override MethodProvider[] BuildMethods()
            => [BuildFromEnumerableMethod(), BuildFromDictionaryMethod()];

        private MethodProvider BuildFromEnumerableMethod()
        {
            var enumerableTType = typeof(IEnumerable<>);
            CSharpType tType = enumerableTType.GetGenericArguments()[0];
            var enumerableParameter = new ParameterProvider("enumerable", FormattableStringHelpers.Empty, enumerableTType);
            var mediaTypeParameter = new ParameterProvider("mediaType", FormattableStringHelpers.Empty, typeof(string), Null);
            var signature = new MethodSignature(
                Name: _fromEnumerableName,
                Modifiers: _methodModifiers,
                Parameters: [enumerableParameter, mediaTypeParameter],
                ReturnType: typeof(BinaryData),
                GenericArguments: [tType],
                GenericParameterConstraints: [Where.NotNull(tType)],
                Description: null,
                ReturnDescription: null);

            var outerUsing = new UsingScopeStatement(typeof(MemoryStream), "stream", MemoryStreamSnippets.New(Int(_initialStreamCapacity)), out var streamVar);
            var innerUsing = new UsingScopeStatement(typeof(Utf8JsonWriter), "writer", New.Instance<Utf8JsonWriter>(streamVar), out var writerVar);
            var writer = writerVar.As<Utf8JsonWriter>();
            innerUsing.AddRange(
            [
                writer.WriteStartArray(),
                new ForEachStatement("item", enumerableParameter.As(enumerableParameter.Type), out var item)
                {
                    writer.WriteObjectValue(item.As(tType), ModelSerializationExtensionsSnippets.Wire)
                },
                writer.WriteEndArray(),
            ]);
            outerUsing.AddRange(
            [
                innerUsing,
                MethodBodyStatement.EmptyLine,
                Return(BinaryDataSnippets.FromBytes(streamVar.As<MemoryStream>().GetWrittenMemory(), mediaTypeParameter))
            ]);

            return new MethodProvider(signature, new MethodBodyStatement[] { outerUsing }, this);
        }

        private MethodProvider BuildFromDictionaryMethod()
        {
            var dictionaryTType = typeof(IDictionary<,>);
            CSharpType valueType = dictionaryTType.GetGenericArguments()[1];
            var dictionaryParameter = new ParameterProvider("dictionary", FormattableStringHelpers.Empty, new CSharpType(dictionaryTType, typeof(string), valueType));
            var mediaTypeParameter = new ParameterProvider("mediaType", FormattableStringHelpers.Empty, typeof(string), Null);
            var signature = new MethodSignature(
                Name: _fromDictionaryName,
                Modifiers: _methodModifiers,
                Parameters: [dictionaryParameter, mediaTypeParameter],
                ReturnType: typeof(BinaryData),
                GenericArguments: [valueType],
                GenericParameterConstraints: [Where.NotNull(valueType)],
                Description: null,
                ReturnDescription: null);

            var outerUsing = new UsingScopeStatement(typeof(MemoryStream), "stream", MemoryStreamSnippets.New(Int(_initialStreamCapacity)), out var streamVar);
            var innerUsing = new UsingScopeStatement(typeof(Utf8JsonWriter), "writer", New.Instance<Utf8JsonWriter>(streamVar), out var writerVar);
            var writer = writerVar.As<Utf8JsonWriter>();
            innerUsing.AddRange(
            [
                writer.WriteStartObject(),
                new ForEachStatement("item", dictionaryParameter.As(dictionaryParameter.Type), out var item)
                {
                    writer.WritePropertyName(item.Property("Key")),
                    writer.WriteObjectValue(item.Property("Value").As(valueType), ModelSerializationExtensionsSnippets.Wire)
                },
                writer.WriteEndObject(),
            ]);
            outerUsing.AddRange(
            [
                innerUsing,
                MethodBodyStatement.EmptyLine,
                Return(BinaryDataSnippets.FromBytes(streamVar.As<MemoryStream>().GetWrittenMemory(), mediaTypeParameter))
            ]);

            return new MethodProvider(signature, new MethodBodyStatement[] { outerUsing }, this);
        }
    }
}
