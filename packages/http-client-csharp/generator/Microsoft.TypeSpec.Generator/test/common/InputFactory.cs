// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;

namespace Microsoft.TypeSpec.Generator.Tests.Common
{
    public static class InputFactory
    {
        public static class EnumMember
        {
            public static InputEnumTypeValue Int32(string name, int value, InputEnumType enumType)
            {
                return new InputEnumTypeValue(name, value, InputPrimitiveType.Int32, "", $"{name} description", enumType);
            }

            public static InputEnumTypeValue Float32(string name, float value, InputEnumType enumType)
            {
                return new InputEnumTypeValue(name, value, InputPrimitiveType.Float32, "", $"{name} description", enumType);
            }

            public static InputEnumTypeValue Float64(string name, double value, InputEnumType enumType)
            {
                return new InputEnumTypeValue(name, value, InputPrimitiveType.Float64, "", $"{name} description", enumType);
            }

            public static InputEnumTypeValue String(string name, string value, InputEnumType enumType)
            {
                return new InputEnumTypeValue(name, value, InputPrimitiveType.String, "", $"{name} description", enumType);
            }
        }

        public static class Literal
        {
            public static InputLiteralType String(string value, string? name = null, string? @namespace = null)
            {
                return new InputLiteralType(name ?? string.Empty, @namespace ?? string.Empty, InputPrimitiveType.String, value);
            }

            public static InputLiteralType Int32(int value, string? name = null, string? @namespace = null)
            {
                return new InputLiteralType(name ?? string.Empty, @namespace ?? string.Empty, InputPrimitiveType.Int32, value);
            }
        }

        public static class Constant
        {
            public static InputConstant String(string value)
            {
                return new InputConstant(value, InputPrimitiveType.String);
            }

            public static InputConstant Int64(long value)
            {
                return new InputConstant(value, InputPrimitiveType.Int64);
            }
        }

        public static InputHeaderParameter ContentTypeParameter(string contentType)
            => HeaderParameter(
                "contentType",
                Literal.String(contentType),
                isRequired: true,
                defaultValue: Constant.String(contentType),
                serializedName: "Content-Type",
                isContentType: true,
                scope: InputParameterScope.Constant);

        public static InputNamespace Namespace(
            string name,
            IEnumerable<InputModelType>? models = null,
            IEnumerable<InputEnumType>? enums = null,
            IEnumerable<InputClient>? clients = null,
            IEnumerable<InputLiteralType>? constants = null)
        {
            return new InputNamespace(
                name,
                [],
                constants is null ? [] : [.. constants],
                enums is null ? [] : [.. enums],
                models is null ? [] : [.. models],
                clients is null ? [] : [.. clients],
                new InputAuth());
        }

        public static InputEnumType StringEnum(
            string name,
            IEnumerable<(string Name, string Value)> values,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.Output,
            bool isExtensible = false,
            string clientNamespace = "Sample.Models")
        {
            var enumValues = new List<InputEnumTypeValue>();
            var enumType = Enum(
                name,
                InputPrimitiveType.String,
                enumValues,
                access: access,
                usage: usage,
                isExtensible: isExtensible,
                clientNamespace: clientNamespace);

            foreach (var (valueName, value) in values)
            {
                enumValues.Add(EnumMember.String(valueName, value, enumType));
            }

            return enumType;
        }

        public static InputEnumType Int32Enum(
            string name,
            IEnumerable<(string Name, int Value)> values,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.Output,
            bool isExtensible = false,
            string clientNamespace = "Sample.Models")
        {
            var enumValues = new List<InputEnumTypeValue>();
            var enumType = Enum(
                name,
                InputPrimitiveType.Int32,
                enumValues,
                access: access,
                usage: usage,
                isExtensible: isExtensible,
                clientNamespace: clientNamespace);

            foreach (var (valueName, value) in values)
            {
                enumValues.Add(EnumMember.Int32(valueName, value, enumType));
            }

            return enumType;
        }

        public static InputEnumType Float32Enum(
            string name,
            IEnumerable<(string Name, float Value)> values,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.Output,
            bool isExtensible = false,
            string clientNamespace = "Sample.Models")
        {
            var enumValues = new List<InputEnumTypeValue>();
            var enumType = Enum(
                name,
                InputPrimitiveType.Float32,
                enumValues,
                access: access,
                usage: usage,
                isExtensible: isExtensible,
                clientNamespace: clientNamespace);

            foreach (var (valueName, value) in values)
            {
                enumValues.Add(EnumMember.Float32(valueName, value, enumType));
            }

            return enumType;
        }

        public static InputEnumType Float64Enum(
            string name,
            IEnumerable<(string Name, double Value)> values,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.Output,
            bool isExtensible = false,
            string clientNamespace = "Sample.Models")
        {
            var enumValues = new List<InputEnumTypeValue>();
            var enumType = Enum(
                name,
                InputPrimitiveType.Float64,
                enumValues,
                access: access,
                usage: usage,
                isExtensible: isExtensible,
                clientNamespace: clientNamespace);

            foreach (var (valueName, value) in values)
            {
                enumValues.Add(EnumMember.Float64(valueName, value, enumType));
            }

            return enumType;
        }

        private static InputEnumType Enum(
            string name,
            InputPrimitiveType underlyingType,
            IReadOnlyList<InputEnumTypeValue> values,
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Output | InputModelTypeUsage.Input,
            bool isExtensible = false,
            string clientNamespace = "Sample.Models")
            => new InputEnumType(
                name,
                clientNamespace,
                name,
                access,
                null,
                "",
                $"{name} description",
                usage,
                underlyingType,
                values,
                isExtensible);

        public static InputModelProperty Property(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isDiscriminator = false,
            bool isHttpMetadata = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? wireName = null,
            string? summary = null,
            string? serializedName = null,
            string? doc = null)
        {
            return new InputModelProperty(
                name: name,
                summary: summary,
                doc: doc ?? $"Description for {name}",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                defaultValue: defaultValue,
                isHttpMetadata: isHttpMetadata,
                access: null,
                isDiscriminator: isDiscriminator,
                serializedName: serializedName ?? wireName ?? name.ToVariableName(),
                serializationOptions: new(json: new(wireName ?? name.ToVariableName())));
        }

        public static InputHeaderParameter HeaderParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            bool isContentType = false,
            string? summary = null,
            string? doc = null,
            string? collectionFormat = null,
            string? serializedName = null,
            InputConstant? defaultValue = null,
            InputParameterScope scope = InputParameterScope.Method)
        {
            return new InputHeaderParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                isContentType: isContentType,
                access: null,
                defaultValue: defaultValue,
                collectionFormat: collectionFormat,
                scope: scope,
                arraySerializationDelimiter: null,
                serializedName: serializedName ?? name);
        }

        public static InputQueryParameter QueryParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? summary = null,
            string? doc = null,
            string? collectionFormat = null,
            string? serializedName = null,
            bool explode = false,
            InputParameterScope scope = InputParameterScope.Method,
            string? delimiter = null)
        {
            return new InputQueryParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                defaultValue: defaultValue,
                scope: scope,
                arraySerializationDelimiter: delimiter,
                access: null,
                serializedName: serializedName ?? name,
                collectionFormat: collectionFormat,
                explode: explode);
        }

        public static InputPathParameter PathParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? summary = null,
            string? doc = null,
            string? serializedName = null,
            bool allowReserved = false,
            bool explode = false,
            bool skipUrlEncoding = false,
            string? serverUrlTemplate = null,
            InputParameterScope scope = InputParameterScope.Method)
        {
            return new InputPathParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                explode: explode,
                defaultValue: defaultValue,
                scope: scope,
                skipUrlEncoding: skipUrlEncoding,
                serverUrlTemplate: serverUrlTemplate,
                access: null,
                serializedName: serializedName ?? name,
                allowReserved: allowReserved);
        }

        public static InputEndpointParameter EndpointParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? summary = null,
            string? doc = null,
            string? serializedName = null,
            bool skipUrlEncoding = false,
            bool isEndpoint = true,
            string? serverUrlTemplate = null,
            InputParameterScope scope = InputParameterScope.Client)
        {
            return new InputEndpointParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                defaultValue: defaultValue,
                scope: scope,
                skipUrlEncoding: skipUrlEncoding,
                serverUrlTemplate: serverUrlTemplate,
                isEndpoint: isEndpoint,
                access: null,
                serializedName: serializedName ?? name);
        }

        public static InputBodyParameter BodyParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? summary = null,
            string? doc = null,
            string? serializedName = null,
            string[]? contentTypes = null,
            string? defaultContentType = null,
            InputParameterScope scope = InputParameterScope.Method)
        {
            return new InputBodyParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                defaultValue: defaultValue,
                defaultContentType: defaultContentType ?? "application/json",
                contentTypes: contentTypes ?? ["application/json"],
                scope: scope,
                access: null,
                serializedName: serializedName ?? name);
        }

        public static InputMethodParameter MethodParameter(
            string name,
            InputType type,
            bool isRequired = false,
            bool isReadOnly = false,
            bool isApiVersion = false,
            InputConstant? defaultValue = null,
            string? summary = null,
            string? doc = null,
            string? serializedName = null,
            InputRequestLocation location = InputRequestLocation.Body,
            InputParameterScope scope = InputParameterScope.Method)
        {
            return new InputMethodParameter(
                name: name,
                summary: summary,
                doc: doc ?? $"{name} description",
                type: type,
                isRequired: isRequired,
                isReadOnly: isReadOnly,
                isApiVersion: isApiVersion,
                defaultValue: defaultValue,
                scope: scope,
                access: null,
                location: location,
                serializedName: serializedName ?? name);
        }

        // Replace reflection with InternalsVisibleTo after fixing https://github.com/microsoft/typespec/issues/7075")]
        private static MethodInfo _addDerivedModelMethod = typeof(InputModelType).GetMethod("AddDerivedModel", BindingFlags.NonPublic | BindingFlags.Instance)!;
        public static InputModelType Model(
            string name,
            string @namespace = "Sample.Models",
            string access = "public",
            InputModelTypeUsage usage = InputModelTypeUsage.Output | InputModelTypeUsage.Input | InputModelTypeUsage.Json,
            IEnumerable<InputModelProperty>? properties = null,
            InputModelType? baseModel = null,
            bool modelAsStruct = false,
            bool isDynamicModel = false,
            string? discriminatedKind = null,
            InputType? additionalProperties = null,
            IDictionary<string, InputModelType>? discriminatedModels = null,
            IEnumerable<InputModelType>? derivedModels = null,
            InputModelProperty? discriminatorProperty = null,
            bool isDynamic = false)
        {
            IEnumerable<InputModelProperty> propertiesList = properties ?? [Property("StringProperty", InputPrimitiveType.String)];

            var model = new InputModelType(
                name,
                @namespace,
                name,
                access,
                null,
                "",
                $"{name} description",
                usage,
                [.. propertiesList],
                baseModel,
                derivedModels is null ? [] : [.. derivedModels],
                discriminatedKind,
                discriminatorProperty ?? propertiesList.FirstOrDefault(p =>
                    p is InputModelProperty modelProperty && modelProperty.IsDiscriminator),
                discriminatedModels is null
                    ? new Dictionary<string, InputModelType>()
                    : discriminatedModels.AsReadOnly(),
                additionalProperties,
                modelAsStruct,
                new(),
                isDynamic);
            if (baseModel is not null)
            {
                _addDerivedModelMethod.Invoke(baseModel, new object[] { model });
            }
            if (isDynamicModel)
            {
                model.IsDynamicModel = true;
            }
            return model;
        }

        public static InputType Array(InputType elementType)
        {
            return new InputArrayType("list", "list", elementType);
        }

        public static InputType Dictionary(InputType valueType, InputType? keyType = null)
        {
            return new InputDictionaryType("dictionary", keyType ?? InputPrimitiveType.String, valueType);
        }

        public static InputType Union(IList<InputType> types)
        {
            return new InputUnionType("union", [.. types]);
        }

        public static InputBasicServiceMethod BasicServiceMethod(
            string name,
            InputOperation operation,
            string access = "public",
            IReadOnlyList<InputMethodParameter>? parameters = null,
            InputServiceMethodResponse? response = null,
            InputServiceMethodResponse? exception = null)
        {
            return new InputBasicServiceMethod(
                name,
                access,
                [],
                null,
                null,
                operation,
                parameters ?? [],
                response ?? ServiceMethodResponse(null, null),
                exception,
                false,
                true,
                true,
                string.Empty);
        }

        public static InputPagingServiceMethod PagingServiceMethod(
           string name,
           InputOperation operation,
           string access = "public",
           IReadOnlyList<InputMethodParameter>? parameters = null,
           InputServiceMethodResponse? response = null,
           InputServiceMethodResponse? exception = null,
           InputPagingServiceMetadata? pagingMetadata = null)
        {
            return new InputPagingServiceMethod(
                name,
                access,
                [],
                null,
                null,
                operation,
                parameters ?? [],
                response ?? ServiceMethodResponse(null, null),
                exception,
                false,
                true,
                true,
                string.Empty,
                pagingMetadata ?? PagingMetadata([], null, null));
        }

        public static InputPagingServiceMetadata PagingMetadata(IReadOnlyList<string> itemPropertySegments, InputNextLink? nextLink, InputContinuationToken? continuationToken)
        {
            return new InputPagingServiceMetadata(itemPropertySegments, nextLink, continuationToken);
        }

        public static InputOperation Operation(
            string name,
            string access = "public",
            IEnumerable<InputParameter>? parameters = null,
            IEnumerable<InputOperationResponse>? responses = null,
            IEnumerable<string>? requestMediaTypes = null,
            string uri = "",
            string path = "",
            string httpMethod = "GET",
            bool generateConvenienceMethod = true)
        {
            return new InputOperation(
                name,
                null,
                "",
                $"{name} description",
                null,
                access,
                parameters is null ? [] : [.. parameters],
                responses is null ? [OperationResponse()] : [.. responses],
                httpMethod,
                uri,
                path,
                null,
                requestMediaTypes is null ? null : [.. requestMediaTypes],
                false,
                true,
                generateConvenienceMethod,
                name);
        }

        public static InputPagingServiceMetadata NextLinkPagingMetadata(
            IReadOnlyList<string> itemSegments,
            IReadOnlyList<string> nextLinkSegments,
            InputResponseLocation nextLinkLocation,
            IReadOnlyList<InputParameter>? reinjectedParameters = null)
        {
            return PagingMetadata(
                itemSegments,
                new InputNextLink(null, nextLinkSegments, nextLinkLocation, reinjectedParameters),
                null);
        }

        public static InputPagingServiceMetadata ContinuationTokenPagingMetadata(InputParameter parameter, IReadOnlyList<string> itemSegments, IReadOnlyList<string> continuationTokenSegments, InputResponseLocation continuationTokenLocation)
        {
            return new InputPagingServiceMetadata(
                itemSegments,
                null,
                continuationToken: new InputContinuationToken(parameter, continuationTokenSegments, continuationTokenLocation));
        }

        public static InputOperationResponse OperationResponse(
            IEnumerable<int>? statusCodes = null,
            InputType? bodytype = null,
            IReadOnlyList<InputOperationResponseHeader>? headers = null,
            IReadOnlyList<string>? contentTypes = null)
        {
            return new InputOperationResponse(
                statusCodes is null ? [200] : [.. statusCodes],
                bodytype,
                headers ?? [],
                false,
                contentTypes ?? ["application/json"]);
        }

        public static InputServiceMethodResponse ServiceMethodResponse(InputType? type, IReadOnlyList<string>? resultSegments)
        {
            return new InputServiceMethodResponse(type, resultSegments);
        }

        private static readonly Dictionary<InputClient, IList<InputClient>> _childClientsCache = new();

        public static InputClient Client(string name, string clientNamespace = "Sample", string? doc = null, IEnumerable<InputServiceMethod>? methods = null, IEnumerable<InputParameter>? parameters = null, InputClient? parent = null, string? crossLanguageDefinitionId = null, IEnumerable<string>? apiVersions = null)
        {
            // when this client has parent, we add the constructed client into the `children` list of the parent
            var clientChildren = new List<InputClient>();
            var client = new InputClient(
                name,
                clientNamespace,
                crossLanguageDefinitionId ?? $"{clientNamespace}.{name}",
                string.Empty,
                doc ?? $"{name} description",
                methods is null ? [] : [.. methods],
                parameters is null ? [] : [.. parameters],
                parent,
                clientChildren,
                apiVersions is null ? [] : [.. apiVersions]);
            _childClientsCache[client] = clientChildren;
            // when we have a parent, we need to find the children list of this parent client and update accordingly.
            if (parent != null && _childClientsCache.TryGetValue(parent, out var children))
            {
                children.Add(client);
            }
            return client;
        }
    }
}
