// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Internal;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets
    {
        internal class SystemModelSnippets : ModelSnippets
        {
            private readonly CSharpType _modelReaderWriterOptionsType = typeof(ModelReaderWriterOptions);
            private readonly Parameter _utf8JsonWriterParameter =
                new("writer", null, typeof(Utf8JsonWriter), null, ValidationType.None, null);
            private readonly Parameter _utf8JsonReaderParameter =
                new("reader", null, typeof(Utf8JsonReader), null, ValidationType.None, null, IsRef: true);
            private readonly Parameter _serializationOptionsParameter =
                new("options", null, typeof(ModelReaderWriterOptions), null, ValidationType.None, null);
            private readonly Parameter _dataParameter = new("data", null, typeof(BinaryData), null, ValidationType.None, null);

            /// <summary>
            /// Builds the serialization method for the JSON model interface.
            /// </summary>
            public override CSharpMethod? BuildJsonModelSerializationMethod(CSharpType jsonModelInterface)
            {
                // void IJsonModel<T>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
                return new CSharpMethod
                (
                  new MethodSignature(nameof(IJsonModel<object>.Write), null, null, MethodSignatureModifiers.None, null, null, new[] { _utf8JsonWriterParameter, _serializationOptionsParameter }, ExplicitInterface: jsonModelInterface),
                  // TO-DO: Add body for json properties' serialization https://github.com/microsoft/typespec/issues/3330
                  Snippets.EmptyStatement,
                  CSharpMethodKinds.JsonModelSerialization
                );
            }

            /// <summary>
            /// Builds the deserialization method for the JSON model interface.
            /// </summary>
            public override CSharpMethod? BuildJsonModelDeserializationMethod(CSharpType jsonModelInterface)
            {
                var typeOfT = TryGetModelArgumentType(jsonModelInterface);

                // T IJsonModel<T>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
                return new CSharpMethod
                (
                  new MethodSignature(nameof(IJsonModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { _utf8JsonReaderParameter, _serializationOptionsParameter }, ExplicitInterface: jsonModelInterface),
                  // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                  Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>())),
                  CSharpMethodKinds.JsonModelDeserialization
                );
            }

            /// <summary>
            /// Builds the serialization method for the I model interface.
            /// </summary>
            public override CSharpMethod? BuildIModelSerializationMethod(CSharpType iModelInterface)
            {
                var returnType = typeof(BinaryData);
                // BinaryData IPersistableModel<T>.Write(ModelReaderWriterOptions options)
                return new CSharpMethod
                (
                  new MethodSignature(nameof(IPersistableModel<object>.Write), null, null, MethodSignatureModifiers.None, returnType, null, new[] { _serializationOptionsParameter }, ExplicitInterface: iModelInterface),
                  // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                  Snippets.Return(new NewInstanceExpression(returnType, new ValueExpression[] { new StringLiteralExpression(iModelInterface.Name, false) })),
                  CSharpMethodKinds.IModelSerialization
                );
            }

            /// <summary>
            /// Builds the deserialization method for the I model interface.
            /// </summary>
            public override CSharpMethod? BuildIModelDeserializationMethod(CSharpType iModelInterface)
            {
                var typeOfT = TryGetModelArgumentType(iModelInterface);
                // IPersistableModel<T>.Create(BinaryData data, ModelReaderWriterOptions options)
                return new CSharpMethod
                (
                  new MethodSignature(nameof(IPersistableModel<object>.Create), null, null, MethodSignatureModifiers.None, typeOfT, null, new[] { _dataParameter, _serializationOptionsParameter }, ExplicitInterface: iModelInterface),
                  // TO-DO: Call the base model ctor for now until the model properties are serialized https://github.com/microsoft/typespec/issues/3330
                  Snippets.Return(new NewInstanceExpression(typeOfT, Array.Empty<ValueExpression>())),
                  CSharpMethodKinds.IModelDeserialization
                );
            }

            /// <summary>
            /// Builds the get format method for the I model interface.
            /// </summary>
            public override CSharpMethod? BuildIModelGetFormatMethod(CSharpType iModelInterface, ValueExpression wireFormat)
            {
                var typeOfT = TryGetModelArgumentType(iModelInterface);
                // ModelReaderWriterFormat IPersistableModel<T>.GetFormatFromOptions(ModelReaderWriterOptions options)
                return new CSharpMethod
                (
                  new MethodSignature(nameof(IPersistableModel<object>.GetFormatFromOptions), null, null, MethodSignatureModifiers.None, typeof(string), null, new[] { _serializationOptionsParameter }, ExplicitInterface: iModelInterface),
                  wireFormat,
                  CSharpMethodKinds.IModelGetFormat
                );
            }

            /// <summary>
            /// Attempts to get the model argument type from the model interface.
            /// </summary>
            /// <param name="modelInterface">The <see cref="CSharpType"/> that represents the model interface.</param>
            /// <returns>The first argument type of <paramref name="modelInterface"/>.</returns>
            /// <exception cref="InvalidOperationException">Thrown if the <paramref name="modelInterface"/> contains no arguments.</exception>
            private CSharpType TryGetModelArgumentType(CSharpType modelInterface)
            {
                var interfaceArgs = modelInterface.Arguments;
                if (!interfaceArgs.Any())
                {
                    throw new InvalidOperationException($"Expected at least 1 argument for {modelInterface}, but found none.");
                }

                return interfaceArgs[0];
            }

            public override CSharpMethod BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers)
            {
                return new CSharpMethod
                (
                    new MethodSignature(ClientModelPlugin.Instance.Configuration.ApiTypes.ToRequestContentName, null, $"Convert into a {nameof(Utf8JsonRequestBody)}.", modifiers, typeof(RequestBody), null, Array.Empty<Parameter>()),
                    new[]
                    {
                        Snippets.Extensible.RestOperations.DeclareContentWithUtf8JsonWriter(out var requestContent, out var writer),
                        writer.WriteObjectValue(Snippets.This),
                        Snippets.Return(requestContent)
                    },
                    "default"
                );
            }

            public override CSharpMethod BuildFromOperationResponseMethod(TypeProvider typeProvider, MethodSignatureModifiers modifiers)
            {
                var result = new Parameter("response", $"The result to deserialize the model from.", typeof(PipelineResponse), null, ValidationType.None, null);
                return new CSharpMethod
                (
                    new MethodSignature(ClientModelPlugin.Instance.Configuration.ApiTypes.FromResponseName, null, $"Deserializes the model from a raw response.", modifiers, typeProvider.Type, null, new[] { result }),
                    new MethodBodyStatement[]
                    {
                        Snippets.UsingVar("document", JsonDocumentExpression.Parse(new PipelineResponseExpression(result).Content), out var document),
                        Snippets.Return(ObjectTypeExpression.Deserialize(typeProvider, document.RootElement))
                    },
                    "default"
                );
            }

            public override TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model) => new RequestBodyExpression(model.Invoke("ToRequestBody"));
        }
    }
}
