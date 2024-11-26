// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmTypeFactory : TypeFactory
    {
        private Dictionary<InputClient, ClientProvider>? _clientCache;
        private Dictionary<InputClient, ClientProvider> ClientCache => _clientCache ??= [];

        public virtual CSharpType MatchConditionsType => typeof(PipelineMessageClassifier);

        public virtual CSharpType KeyCredentialType => typeof(ApiKeyCredential);

        public virtual CSharpType TokenCredentialType => throw new NotImplementedException("Token credential is not supported in Scm libraries yet");

        public virtual IClientResponseApi ClientResponseApi => ClientResultProvider.Instance;

        public virtual IHttpResponseApi HttpResponseApi => PipelineResponseProvider.Instance;

        public virtual IHttpMessageApi HttpMessageApi => PipelineMessageProvider.Instance;

        public virtual IHttpRequestOptionsApi HttpRequestOptionsApi => RequestOptionsProvider.Instance;

        public virtual IExpressionApi<HttpRequestApi> HttpRequestApi => PipelineRequestProvider.Instance;

        public virtual IClientPipelineApi ClientPipelineApi => ClientPipelineProvider.Instance;

        public virtual IStatusCodeClassifierApi StatusCodeClassifierApi => PipelineMessageClassifierProvider.Instance;

        public virtual IRequestContentApi RequestContentApi => BinaryContentProvider.Instance;

        /// <summary>
        /// Returns the serialization type providers for the given input type.
        /// </summary>
        /// <param name="inputType">The input type.</param>
        /// <param name="typeProvider">The type provider.</param>
        protected override IReadOnlyList<TypeProvider> CreateSerializationsCore(InputType inputType, TypeProvider typeProvider)
        {
            switch (inputType)
            {
                case InputModelType inputModel when inputModel.Usage.HasFlag(InputModelTypeUsage.Json):
                    if (typeProvider is ModelProvider modelProvider)
                    {
                        return [new MrwSerializationTypeDefinition(inputModel, modelProvider)];
                    }
                    return [];
                case InputEnumType inputEnumType:
                    switch (typeProvider.CustomCodeView)
                    {
                        case { Type: { IsValueType: true, IsStruct: true } }:
                            return CreateExtensibleEnumSerializations(inputEnumType, typeProvider);
                        case { Type: { IsValueType: true, IsStruct: false } }:
                            return [new FixedEnumSerializationProvider(inputEnumType, typeProvider)];
                    }
                    if (inputEnumType.IsExtensible)
                    {
                        return CreateExtensibleEnumSerializations(inputEnumType, typeProvider);
                    }
                    return [new FixedEnumSerializationProvider(inputEnumType, typeProvider)];
                default:
                    return base.CreateSerializationsCore(inputType, typeProvider);
            }
        }

        private ExtensibleEnumSerializationProvider[] CreateExtensibleEnumSerializations(InputEnumType inputEnumType, TypeProvider typeProvider)
        {
            // if the underlying type is string, we don't need to generate serialization methods as we use ToString
            if (ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputEnumType)?.UnderlyingEnumType == typeof(string))
            {
                return [];
            }
            return [new ExtensibleEnumSerializationProvider(inputEnumType, typeProvider)];
        }

        public ClientProvider CreateClient(InputClient inputClient)
        {
            if (ClientCache.TryGetValue(inputClient, out var client))
            {
                return client;
            }

            client = CreateClientCore(inputClient);
            ClientCache[inputClient] = client;
            return client;
        }

        protected virtual ClientProvider CreateClientCore(InputClient inputClient) => new ClientProvider(inputClient);

        /// <summary>
        /// Factory method for creating a <see cref="MethodProviderCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="enclosingType">The <see cref="TypeProvider"/> that will contain the methods.</param>
        /// <returns>An instance of <see cref="MethodProviderCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        internal MethodProviderCollection? CreateMethods(InputOperation operation, TypeProvider enclosingType)
        {
            MethodProviderCollection? methods = new ScmMethodProviderCollection(operation, enclosingType);
            var visitors = ClientModelPlugin.Instance.Visitors;

            foreach (var visitor in visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    methods = scmVisitor.Visit(operation, enclosingType, methods);
                }
            }
            return methods;
        }

        public virtual ValueExpression GetValueTypeDeserializationExpression(
            Type valueType,
            ScopedApi<JsonElement> element,
            SerializationFormat format)
        {
            return valueType switch
            {
                Type t when t == typeof(Uri) =>
                    New.Instance(valueType, element.GetString()),
                Type t when t == typeof(IPAddress) =>
                    Static<IPAddress>().Invoke(nameof(IPAddress.Parse), element.GetString()),
                Type t when t == typeof(BinaryData) =>
                    format is SerializationFormat.Bytes_Base64 or SerializationFormat.Bytes_Base64Url
                        ? BinaryDataSnippets.FromBytes(element.GetBytesFromBase64(format.ToFormatSpecifier()))
                        : BinaryDataSnippets.FromString(element.GetRawText()),
                Type t when t == typeof(Stream) =>
                    BinaryDataSnippets.FromString(element.GetRawText()).ToStream(),
                Type t when t == typeof(JsonElement) =>
                    element.InvokeClone(),
                Type t when t == typeof(object) =>
                    element.GetObject(),
                Type t when t == typeof(bool) =>
                    element.GetBoolean(),
                Type t when t == typeof(char) =>
                    element.GetChar(),
                Type t when ValueTypeIsInt(t) =>
                    GetIntTypeDeserializationExpress(element, t, format),
                Type t when t == typeof(float) =>
                    element.GetSingle(),
                Type t when t == typeof(double) =>
                    element.GetDouble(),
                Type t when t == typeof(decimal) =>
                    element.GetDecimal(),
                Type t when t == typeof(string) =>
                    element.GetString(),
                Type t when t == typeof(Guid) =>
                    element.GetGuid(),
                Type t when t == typeof(byte[]) =>
                    element.GetBytesFromBase64(format.ToFormatSpecifier()),
                Type t when t == typeof(DateTimeOffset) =>
                    format == SerializationFormat.DateTime_Unix
                        ? DateTimeOffsetSnippets.FromUnixTimeSeconds(element.GetInt64())
                        : element.GetDateTimeOffset(format.ToFormatSpecifier()),
                Type t when t == typeof(DateTime) =>
                    element.GetDateTime(),
                Type t when t == typeof(TimeSpan) => format switch
                {
                    SerializationFormat.Duration_Seconds => TimeSpanSnippets.FromSeconds(element.GetInt32()),
                    SerializationFormat.Duration_Seconds_Float or SerializationFormat.Duration_Seconds_Double => TimeSpanSnippets.FromSeconds(element.GetDouble()),
                    _ => element.GetTimeSpan(format.ToFormatSpecifier())
                },
                _ => throw new NotSupportedException($"Framework type {valueType} is not supported.")
            };
        }

        internal bool ValueTypeIsInt(Type valueType) =>
            valueType == typeof(long) ||
            valueType == typeof(int) ||
            valueType == typeof(short) ||
            valueType == typeof(sbyte) ||
            valueType == typeof(byte);

        private static ValueExpression GetIntTypeDeserializationExpress(ScopedApi<JsonElement> element, Type type, SerializationFormat format) => format switch
        {
            // when `@encode(string)`, the type is serialized as string, so we need to deserialize it from string
            // sbyte.Parse(element.GetString())
            SerializationFormat.Int_String => new InvokeMethodExpression(type, nameof(int.Parse), [element.GetString()]),
            _ => type switch
            {
                Type t when t == typeof(long) => element.GetInt64(),
                Type t when t == typeof(int) => element.GetInt32(),
                Type t when t == typeof(short) => element.GetInt16(),
                Type t when t == typeof(sbyte) => element.GetSByte(),
                Type t when t == typeof(byte) => element.GetByte(),
                _ => throw new NotSupportedException($"Framework type {type} is not int.")
            }
        };

        public virtual MethodBodyStatement SerializeValueType(
            CSharpType type,
            SerializationFormat serializationFormat,
            ValueExpression value,
            Type valueType,
            ScopedApi<Utf8JsonWriter> utf8JsonWriterSnippet,
            ScopedApi<ModelReaderWriterOptions> mrwOptionsParameterSnippet)
        {
            if (valueType == typeof(Nullable<>))
            {
                valueType = type.Arguments[0].FrameworkType;
            }

            value = value.NullableStructValue(type);

            return valueType switch
            {
                var t when t == typeof(JsonElement) =>
                    value.As<JsonElement>().WriteTo(utf8JsonWriterSnippet),
                var t when ClientModelPlugin.Instance.TypeFactory.ValueTypeIsInt(t) && serializationFormat == SerializationFormat.Int_String =>
                    utf8JsonWriterSnippet.WriteStringValue(value.InvokeToString()),
                var t when ValueTypeIsNumber(t) =>
                    utf8JsonWriterSnippet.WriteNumberValue(value),
                var t when t == typeof(object) =>
                    utf8JsonWriterSnippet.WriteObjectValue(value.As(valueType), mrwOptionsParameterSnippet),
                var t when t == typeof(string) || t == typeof(char) || t == typeof(Guid) =>
                    utf8JsonWriterSnippet.WriteStringValue(value),
                var t when t == typeof(bool) =>
                    utf8JsonWriterSnippet.WriteBooleanValue(value),
                var t when t == typeof(byte[]) =>
                    utf8JsonWriterSnippet.WriteBase64StringValue(value, serializationFormat.ToFormatSpecifier()),
                var t when t == typeof(DateTimeOffset) || t == typeof(DateTime) || t == typeof(TimeSpan) =>
                    MrwSerializationTypeDefinition.SerializeDateTimeRelatedTypes(valueType, serializationFormat, value, utf8JsonWriterSnippet),
                var t when t == typeof(IPAddress) =>
                    utf8JsonWriterSnippet.WriteStringValue(value.InvokeToString()),
                var t when t == typeof(Uri) =>
                    utf8JsonWriterSnippet.WriteStringValue(new MemberExpression(value, nameof(Uri.AbsoluteUri))),
                var t when t == typeof(BinaryData) =>
                    MrwSerializationTypeDefinition.SerializeBinaryData(valueType, serializationFormat, value, utf8JsonWriterSnippet),
                var t when t == typeof(Stream) =>
                    utf8JsonWriterSnippet.WriteBinaryData(BinaryDataSnippets.FromStream(value, false)),
                _ => throw new NotSupportedException($"Type {valueType} serialization is not supported.")
            };
        }

        private static bool ValueTypeIsNumber(Type valueType) =>
            valueType == typeof(decimal) ||
            valueType == typeof(double) ||
            valueType == typeof(float) ||
            ClientModelPlugin.Instance.TypeFactory.ValueTypeIsInt(valueType);
    }
}
