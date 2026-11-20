// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    /// <summary>
    /// Conversions that generated clients use instead of the cast operators so that the model proxies configured on the
    /// client options apply to request bodies and responses. The cast operators can't take the client's options.
    /// </summary>
    public partial class MrwSerializationTypeDefinition
    {
        internal static string ToRequestContentMethodName
            => $"To{ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType.Name}";

        internal static string FromResponseMethodName
            => $"From{ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.ClientResponseType.Name}";

        internal static bool HasRequestContentConversion(CSharpType type)
            => GetModelSerialization(type)?.GeneratesRequestContentConversion == true;

        internal static bool HasResponseConversion(CSharpType type)
            => GetModelSerialization(type)?.GeneratesResponseConversion == true;

        private static MrwSerializationTypeDefinition? GetModelSerialization(CSharpType type)
        {
            if (!ValueExpression.Empty.ToApi<ClientPipelineApi>().SupportsModelProxies
                || !ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(type, out var provider)
                || provider is not ModelProvider || provider is SystemObjectModelProvider)
            {
                return null;
            }

            return provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().FirstOrDefault();
        }

        private bool GeneratesRequestContentConversion
            => !_inputModel.IsUnknownDiscriminatorModel && ScmCodeModelGenerator.Instance.TypeFactory.RootInputModels.Contains(_inputModel);

        private bool GeneratesResponseConversion
            => !_inputModel.IsUnknownDiscriminatorModel && ScmCodeModelGenerator.Instance.TypeFactory.RootOutputModels.Contains(_inputModel);

        // internal BinaryContent ToBinaryContent(ModelReaderWriterOptions options) => BinaryContent.Create(this, options);
        private MethodProvider BuildToRequestContentWithOptionsMethod()
        {
            var requestContentType = ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType;
            var optionsParameter = new ParameterProvider(
                "options",
                $"The options used to write the model, including the registered model proxies.",
                typeof(ModelReaderWriterOptions));
            var modifiers = MethodSignatureModifiers.Internal;
            if (AnyBaseModelSerialization(serialization => serialization.GeneratesRequestContentConversion))
            {
                modifiers |= MethodSignatureModifiers.New;
            }

            return new MethodProvider(
                new MethodSignature(
                    ToRequestContentMethodName,
                    FormattableStringHelpers.FromString($"Converts the model to {requestContentType.Name} using the specified options."),
                    modifiers,
                    requestContentType,
                    null,
                    [optionsParameter]),
                Return(RequestContentApiSnippets.Create(This, optionsParameter.As<ModelReaderWriterOptions>())),
                this);
        }

        // internal static T FromClientResult(ClientResult result, ModelReaderWriterOptions options)
        // Reads through ModelReaderWriter when proxies apply; otherwise it matches the explicit cast operator, but passes
        // the options to the deserializer so nested models still honor the proxies.
        private MethodProvider GetFromClientResultWithOptionsMethod(bool supportsJson, bool supportsXml)
        {
            var clientResponseApi = ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi;
            var result = new ParameterProvider(
                clientResponseApi.ResponseParameterName,
                $"The {clientResponseApi.ClientResponseType:C} to deserialize the {Type:C} from.",
                clientResponseApi.ClientResponseType);
            var optionsParameter = new ParameterProvider(
                "options",
                $"The options used to read the model, including the registered model proxies.",
                typeof(ModelReaderWriterOptions));
            var options = optionsParameter.As<ModelReaderWriterOptions>();

            var modifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static;
            if (AnyBaseModelSerialization(serialization => serialization.GeneratesResponseConversion))
            {
                modifiers |= MethodSignatureModifiers.New;
            }

            // PipelineResponse response = result.GetRawResponse();
            var response = result.ToApi<ClientResponseApi>();
            var httpResponse = result.ToApi<HttpResponseApi>();
            MethodBodyStatement responseDeclaration = MethodBodyStatement.Empty;
            if (response.Original != response.GetRawResponse().Original)
            {
                responseDeclaration = Declare("response", ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.HttpResponseType, response.GetRawResponse(), out var responseVar);
                response = responseVar.ToApi<ClientResponseApi>();
                httpResponse = responseVar.ToApi<HttpResponseApi>();
            }
            var content = response.Property(nameof(HttpResponseApi.Content)).As<BinaryData>();

            MethodBodyStatement[] body;
            if (supportsJson && supportsXml)
            {
                var isJson = httpResponse.TryGetHeader(ContentTypeHeader, out var contentType)
                    .And(contentType!.StartsWith(Literal("application/json"), StringComparison.OrdinalIgnoreCase));
                body =
                [
                    responseDeclaration,
                    MethodBodyStatement.EmptyLine,
                    new IfStatement(isJson) { BuildJsonFromClientResultBody(content, options) },
                    MethodBodyStatement.EmptyLine,
                    .. BuildXmlFromClientResultBody(response, content, options, options.ToXmlOptions())
                ];
            }
            else if (supportsXml)
            {
                body = [responseDeclaration, .. BuildXmlFromClientResultBody(response, content, options, options)];
            }
            else
            {
                body = [responseDeclaration, .. BuildJsonFromClientResultBody(content, options)];
            }

            return new MethodProvider(
                new MethodSignature(FromResponseMethodName, null, modifiers, Type, null, [result, optionsParameter]),
                body,
                this);
        }

        private MethodBodyStatement[] BuildJsonFromClientResultBody(ScopedApi<BinaryData> content, ScopedApi<ModelReaderWriterOptions> options)
        {
            if (_model is ScmModelProvider { IsDynamicModel: true })
            {
                return
                [
                    ReadThroughProxy(content, options, options),
                    Declare("data", typeof(BinaryData), content, out var data),
                    UsingDeclare("document", typeof(JsonDocument), data.As<BinaryData>().Parse(ModelSerializationExtensionsSnippets.JsonDocumentOptions), out var dynamicDocument),
                    Return(GetDeserializationMethodInvocationForType(_model, dynamicDocument.As<JsonDocument>().RootElement(), data, options))
                ];
            }

            return
            [
                ReadThroughProxy(content, options, options),
                UsingDeclare("document", typeof(JsonDocument), content.Parse(ModelSerializationExtensionsSnippets.JsonDocumentOptions), out var document),
                Return(GetDeserializationMethodInvocationForType(_model, document.As<JsonDocument>().RootElement(), null, options))
            ];
        }

        private MethodBodyStatement[] BuildXmlFromClientResultBody(
            ClientResponseApi response,
            ScopedApi<BinaryData> content,
            ScopedApi<ModelReaderWriterOptions> options,
            ScopedApi<ModelReaderWriterOptions> readOptions)
            =>
            [
                ReadThroughProxy(content, options, readOptions),
                UsingDeclare("stream", typeof(Stream), response.Property(nameof(HttpResponseApi.ContentStream)), out var stream),
                new IfStatement(stream.Equal(Null)) { Return(Default) },
                MethodBodyStatement.EmptyLine,
                Return(GetDeserializationMethodInvocationForType(_model, XElementSnippets.Load(stream.As<Stream>(), XmlLinqSnippets.PreserveWhitespace), null, options))
            ];

        // if (options.ShouldReadThroughProxy<T>(Context.Default)) { return ModelReaderWriter.Read<T>(content, readOptions, Context.Default); }
        private MethodBodyStatement ReadThroughProxy(
            ScopedApi<BinaryData> content,
            ScopedApi<ModelReaderWriterOptions> options,
            ScopedApi<ModelReaderWriterOptions> readOptions)
            => new IfStatement(options.ShouldReadThroughProxy(Type))
            {
                Return(ModelReaderWriterSnippets.Read(Type, content, readOptions))
            };

        // A derived model's conversion has the same parameters as its base model's, so it must hide it explicitly.
        private bool AnyBaseModelSerialization(Func<MrwSerializationTypeDefinition, bool> predicate)
        {
            var visited = new HashSet<ModelProvider>();
            for (var baseModel = _model.BaseModelProvider; baseModel != null && visited.Add(baseModel); baseModel = baseModel.BaseModelProvider)
            {
                if (baseModel.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Any(predicate))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
