// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input.Examples;
using AutoRest.CSharp.Common.Utilities;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Common.Input
{
    internal class CodeModelConverter
    {
        private readonly Dictionary<ServiceRequest, Func<InputOperation>> _operationsCache;
        private readonly Dictionary<RequestParameter, Func<InputParameter>> _parametersCache;
        private readonly Dictionary<ObjectSchema, InputModelType> _modelsCache;
        private readonly Dictionary<ObjectSchema, List<InputModelProperty>> _modelPropertiesCache;
        private readonly Dictionary<ObjectSchema, List<InputModelType>> _derivedModelsCache;
        private readonly Dictionary<InputOperation, Operation> _inputOperationToOperationMap;

        public CodeModelConverter()
        {
            _operationsCache = new Dictionary<ServiceRequest, Func<InputOperation>>();
            _parametersCache = new Dictionary<RequestParameter, Func<InputParameter>>();
            _modelsCache = new Dictionary<ObjectSchema, InputModelType>();
            _modelPropertiesCache = new Dictionary<ObjectSchema, List<InputModelProperty>>();
            _derivedModelsCache = new Dictionary<ObjectSchema, List<InputModelType>>();
            _inputOperationToOperationMap = new Dictionary<InputOperation, Operation>();
        }

        public InputNamespace CreateNamespace(CodeModel codeModel, SchemaUsageProvider schemaUsages)
        {
            var enums = CreateEnums(codeModel.Schemas.Choices, codeModel.Schemas.SealedChoices);
            var models = CreateModels(codeModel.Schemas.Objects, schemaUsages);
            var clients = CreateClients(codeModel.OperationGroups);

            return new(Name: codeModel.Language.Default.Name,
                Description: codeModel.Language.Default.Description,
                Clients: clients,
                Models: models,
                Enums: enums,
                ApiVersions: GetApiVersions(codeModel),
                Auth: GetAuth(codeModel.Security.Schemes.OfType<SecurityScheme>()));
        }

        public IReadOnlyList<InputClient> CreateClients(IEnumerable<OperationGroup> operationGroups)
            => operationGroups.Select(CreateClient).ToList();

        public InputClient CreateClient(OperationGroup operationGroup)
            => new(
                Name: operationGroup.Language.Default.Name,
                Description: operationGroup.Language.Default.Description,
                Operations: CreateOperations(operationGroup.Operations).Values.ToArray(), true, Array.Empty<InputParameter>(), null)
            {
                Key = operationGroup.Key,
            };

        public IReadOnlyDictionary<ServiceRequest, InputOperation> CreateOperations(IEnumerable<Operation> operations)
        {
            var serviceRequests = new List<ServiceRequest>();
            foreach (var operation in operations)
            {
                foreach (var serviceRequest in operation.Requests)
                {
                    if (serviceRequest.Protocol.Http is not HttpRequest httpRequest)
                    {
                        continue;
                    }

                    serviceRequests.Add(serviceRequest);
                    _operationsCache.CreateAndCacheResult(serviceRequest, () => CreateOperation(serviceRequest, operation, httpRequest));

                    if (operation.RequestMediaTypes != null && !Configuration.Generation1ConvenienceClient)
                    {
                        break;
                    }
                }
            }

            return serviceRequests.ToDictionary(sr => sr, sr => _operationsCache[sr]());
        }

        private InputOperation CreateOperation(ServiceRequest serviceRequest, Operation operation, HttpRequest httpRequest)
        {
            var inputOperation = new InputOperation(
                Name: operation.Language.Default.Name,
                ResourceName: null,
                Summary: operation.Language.Default.Summary,
                Deprecated: operation.Deprecated?.Reason,
                Description: operation.Language.Default.Description,
                Accessibility: operation.Accessibility,
                Parameters: CreateOperationParameters(operation.Parameters.Concat(serviceRequest.Parameters).ToList()),
                Responses: operation.Responses.Select(CreateOperationResponse).ToList(),
                HttpMethod: httpRequest.Method.ToCoreRequestMethod(),
                RequestBodyMediaType: GetBodyFormat((httpRequest as HttpWithBodyRequest)?.KnownMediaType),
                Uri: httpRequest.Uri,
                Path: httpRequest.Path,
                ExternalDocsUrl: operation.ExternalDocs?.Url,
                RequestMediaTypes: operation.RequestMediaTypes?.Keys.ToList(),
                BufferResponse: operation.Extensions?.BufferResponse ?? true,
                LongRunning: CreateLongRunning(operation),
                Paging: CreateOperationPaging(operation),
                GenerateProtocolMethod: true,
                GenerateConvenienceMethod: false)
            {
                KeepClientDefaultValue = Configuration.MethodsToKeepClientDefaultValue.Contains(operation.OperationId)
            };
            _inputOperationToOperationMap[inputOperation] = operation;
            return inputOperation;
        }

        public List<InputParameter> CreateOperationParameters(IReadOnlyCollection<RequestParameter> requestParameters)
        {
            foreach (var parameter in requestParameters)
            {
                _parametersCache.CreateAndCacheResult(parameter, () => CreateOperationParameter(parameter));
            }

            return requestParameters.Select(rp => _parametersCache[rp]()).ToList();
        }

        public InputParameter CreateOperationParameter(RequestParameter input) => new(
            Name: input.Language.Default.Name,
            NameInRequest: input.Language.Default.SerializedName ?? input.Language.Default.Name,
            Description: input.Language.Default.Description,
            Type: CreateType(input),
            Location: GetRequestLocation(input),
            DefaultValue: GetDefaultValue(input),
            IsRequired: input.IsRequired,
            GroupedBy: input.GroupedBy != null ? _parametersCache[input.GroupedBy]() : null,
            Kind: GetOperationParameterKind(input),
            IsApiVersion: input.IsApiVersion,
            IsResourceParameter: Convert.ToBoolean(input.Extensions.GetValue<string>("x-ms-resource-identifier")),
            IsContentType: input.Origin == "modelerfour:synthesized/content-type",
            IsEndpoint: input.Origin == "modelerfour:synthesized/host",
            ArraySerializationDelimiter: GetArraySerializationDelimiter(input),
            Explode: input.Protocol.Http is HttpParameter { Explode: true },
            SkipUrlEncoding: input.Extensions?.SkipEncoding ?? false,
            HeaderCollectionPrefix: input.Extensions?.HeaderCollectionPrefix,
            VirtualParameter: input is VirtualParameter vp &&
                (vp is { Schema: not ConstantSchema } or { Required: not true }) ? vp : null // optional constant parameter can be virtual parameter
        );

        public OperationResponse CreateOperationResponse(ServiceResponse response) => new(
            StatusCodes: response.HttpResponse.IntStatusCodes.ToList(),
            BodyType: GetResponseBodyType(response),
            BodyMediaType: GetBodyFormat(response.HttpResponse.KnownMediaType),
            Headers: GetResponseHeaders(response.HttpResponse.Headers),
            IsErrorResponse: false,
            ContentTypes: Array.Empty<string>()
        );

        private OperationResponseHeader CreateResponseHeader(HttpResponseHeader header) => new(
            Name: header.CSharpName(),
            NameInResponse: header.Extensions?.HeaderCollectionPrefix ?? header.Header,
            Description: header.Language.Default.Description,
            Type: CreateType(header.Schema, header.Extensions?.Format, _modelsCache, true)
        );

        private OperationLongRunning? CreateLongRunning(Operation operation)
        {
            if (!operation.IsLongRunning)
            {
                return null;
            }

            return new OperationLongRunning(
                FinalStateVia: operation.LongRunningFinalStateVia,
                FinalResponse: CreateOperationResponse(operation.LongRunningFinalResponse),
                ResultPath: null
            );
        }

        private OperationPaging? CreateOperationPaging(Operation operation)
        {
            var paging = operation.Language.Default.Paging;
            if (paging == null)
            {
                return null;
            }

            var nextLinkServiceRequest = paging.NextLinkOperation?.Requests.Single();
            if (nextLinkServiceRequest == null || !_operationsCache.TryGetValue(nextLinkServiceRequest, out var nextLinkOperationRef))
            {
                return new OperationPaging(NextLinkName: paging.NextLinkName, ItemName: paging.ItemName);
            }

            return new OperationPaging(NextLinkName: paging.NextLinkName, ItemName: paging.ItemName) { NextLinkOperationRef = nextLinkOperationRef };
        }

        private IReadOnlyList<InputEnumType> CreateEnums(IEnumerable<ChoiceSchema> schemasChoices, IEnumerable<SealedChoiceSchema> schemasSealedChoices)
            => schemasChoices.Select(c => CreateType(c, null, null))
                .Concat(schemasSealedChoices.Select(c => CreateType(c, null, null)))
                .OfType<InputEnumType>()
                .ToList();

        private IReadOnlyList<InputModelType> CreateModels(ICollection<ObjectSchema> schemas, SchemaUsageProvider schemaUsages)
        {
            foreach (var schema in schemas)
            {
                GetOrCreateModel(schema, schemaUsages);
            }

            foreach (var (schema, properties) in _modelPropertiesCache)
            {
                properties.AddRange(schema.Properties.Select(CreateProperty));
            }

            foreach (var schema in schemas)
            {
                var derived = schema.Children?.Immediate.OfType<ObjectSchema>().Select(s => _modelsCache[s]);
                if (derived != null)
                {
                    _derivedModelsCache[schema].AddRange(derived);
                }
            }

            return schemas.Select(s => _modelsCache[s]).ToList();
        }

        private InputModelType GetOrCreateModel(ObjectSchema schema, SchemaUsageProvider schemaUsages)
        {
            if (_modelsCache.TryGetValue(schema, out var model))
            {
                return model;
            }

            var properties = new List<InputModelProperty>();
            var derived = new List<InputModelType>();
            model = new InputModelType(
                Name: schema.Language.Default.Name,
                Namespace: schema.Extensions?.Namespace,
                Accessibility: schema.Extensions?.Accessibility,
                Deprecated: schema.Deprecated?.Reason,
                Description: schema.CreateDescription(),
                Usage: (schemaUsages.GetUsage(schema) & (SchemaTypeUsage.Input | SchemaTypeUsage.Output)) switch
                {
                    SchemaTypeUsage.Input => InputModelTypeUsage.Input,
                    SchemaTypeUsage.Output => InputModelTypeUsage.Output,
                    SchemaTypeUsage.RoundTrip => InputModelTypeUsage.RoundTrip,
                    _ => InputModelTypeUsage.None
                },
                Properties: properties,
                BaseModel: schema.Parents?.Immediate.FirstOrDefault() is ObjectSchema parent
                    ? GetOrCreateModel(parent, schemaUsages)
                    : null,
                DerivedModels: derived,
                DiscriminatorValue: schema.DiscriminatorValue,
                DiscriminatorPropertyName: schema.Discriminator?.Property.SerializedName,
                // TODO -- to support this, it requires more consolidation work in HLC.
                // Currently there are only two places using this converted code mode: HLC and swagger-DPG.
                // HLC only converts schemas into input types for operations to use, when generating models, HLC is using its original schemas, therefore whatever we put here does not change the result.
                // swagger-DPG does not generate models therefore it also does not matter what we put here.
                InheritedDictionaryType: null,
                IsNullable: false);

            _modelsCache[schema] = model;
            _modelPropertiesCache[schema] = properties;
            _derivedModelsCache[schema] = derived;

            return model;
        }

        private InputModelProperty CreateProperty(Property property) => new(
            Name: property.Language.Default.Name,
            SerializedName: property.SerializedName,
            Description: property.Language.Default.Description,
            Type: CreateType(property.Schema, _modelsCache, property.IsNullable),
            IsRequired: property.IsRequired,
            IsReadOnly: property.IsReadOnly,
            IsDiscriminator: property.IsDiscriminator ?? false
        );

        public static InputOperationParameterKind GetOperationParameterKind(RequestParameter input) => input switch
        {
            { Implementation: ImplementationLocation.Client } => InputOperationParameterKind.Client,
            { Schema: ConstantSchema, IsRequired: true } => InputOperationParameterKind.Constant, // only required constant parameter can be Constant kind
                                                                                                  // which will be optimized to disappear from method signature

            // Grouped and flattened parameters shouldn't be added to methods
            { IsFlattened: true } => InputOperationParameterKind.Flattened,
            { GroupedBy: not null } => InputOperationParameterKind.Grouped,
            _ => InputOperationParameterKind.Method
        };

        private static string? GetArraySerializationDelimiter(RequestParameter input) => input.In switch
        {
            HttpParameterIn.Query or HttpParameterIn.Header => (input.Protocol.Http as HttpParameter)?.Style switch
            {
                SerializationStyle.PipeDelimited => "|",
                SerializationStyle.TabDelimited => "\t",
                SerializationStyle.SpaceDelimited => " ",
                null or SerializationStyle.Form or SerializationStyle.Simple => input.Schema switch
                {
                    ArraySchema or ConstantSchema { ValueType: ArraySchema } => ",",
                    _ => null
                },
                _ => throw new ArgumentOutOfRangeException()
            },
            _ => null
        };

        private static BodyMediaType GetBodyFormat(KnownMediaType? knownMediaType) => knownMediaType switch
        {
            KnownMediaType.Binary => BodyMediaType.Binary,
            KnownMediaType.Form => BodyMediaType.Form,
            KnownMediaType.Json => BodyMediaType.Json,
            KnownMediaType.Multipart => BodyMediaType.Multipart,
            KnownMediaType.Text => BodyMediaType.Text,
            KnownMediaType.Xml => BodyMediaType.Xml,
            _ => BodyMediaType.None
        };

        private InputType? GetResponseBodyType(ServiceResponse response) => response switch
        {
            { HttpResponse.KnownMediaType: KnownMediaType.Text } => InputPrimitiveType.String,
            BinaryResponse => InputPrimitiveType.Stream,
            SchemaResponse schemaResponse => CreateType(schemaResponse.Schema, _modelsCache, schemaResponse.IsNullable),
            _ => null
        };

        private IReadOnlyList<OperationResponseHeader> GetResponseHeaders(ICollection<HttpResponseHeader>? headers)
        {
            if (headers == null)
            {
                return Array.Empty<OperationResponseHeader>();
            }
            return headers.Select(header => CreateResponseHeader(header)).ToList();
        }

        public InputType CreateType(RequestParameter requestParameter)
            => CreateType(requestParameter.Schema, requestParameter.Extensions?.Format, _modelsCache, requestParameter.IsNullable || !requestParameter.IsRequired);

        private static InputType CreateType(Schema schema, IReadOnlyDictionary<ObjectSchema, InputModelType>? modelsCache, bool isNullable)
            => CreateType(schema, schema.Extensions?.Format, modelsCache, isNullable);

        private static InputType CreateType(Schema schema, string? format, IReadOnlyDictionary<ObjectSchema, InputModelType>? modelsCache, bool isNullable)
            => CreateType(schema, format, modelsCache) with { IsNullable = isNullable };

        public static InputType CreateType(Schema schema, string? format, IReadOnlyDictionary<ObjectSchema, InputModelType>? modelsCache) => schema switch
        {
            BinarySchema => InputPrimitiveType.Stream,

            ByteArraySchema { Format: ByteArraySchemaFormat.Base64url } => InputPrimitiveType.BytesBase64Url,
            ByteArraySchema => InputPrimitiveType.Bytes,

            DateSchema => InputPrimitiveType.Date,
            DateTimeSchema { Format: DateTimeSchemaFormat.DateTime } => InputPrimitiveType.DateTimeISO8601,
            DateTimeSchema { Format: DateTimeSchemaFormat.DateTimeRfc1123 } => InputPrimitiveType.DateTimeRFC1123,
            DateTimeSchema => InputPrimitiveType.DateTime,
            UnixTimeSchema => InputPrimitiveType.DateTimeUnix,

            TimeSchema => InputPrimitiveType.Time,
            DurationSchema when format == XMsFormat.DurationConstant => InputPrimitiveType.DurationConstant,
            DurationSchema => InputPrimitiveType.DurationISO8601,

            NumberSchema { Type: AllSchemaTypes.Number, Precision: 32 } => InputPrimitiveType.Float32,
            NumberSchema { Type: AllSchemaTypes.Number, Precision: 128 } => InputPrimitiveType.Float128,
            NumberSchema { Type: AllSchemaTypes.Number } => InputPrimitiveType.Float64,
            NumberSchema { Type: AllSchemaTypes.Integer, Precision: 64 } => InputPrimitiveType.Int64,
            NumberSchema { Type: AllSchemaTypes.Integer } => InputPrimitiveType.Int32,

            ArmIdSchema => InputPrimitiveType.ResourceIdentifier,
            { Type: AllSchemaTypes.ArmId } => InputPrimitiveType.ResourceIdentifier,

            { Type: AllSchemaTypes.String } when format == XMsFormat.DateTime => InputPrimitiveType.DateTimeISO8601,
            { Type: AllSchemaTypes.String } when format == XMsFormat.DateTimeRFC1123 => InputPrimitiveType.DateTimeRFC1123,
            { Type: AllSchemaTypes.String } when format == XMsFormat.DateTimeUnix => InputPrimitiveType.DateTimeUnix,
            { Type: AllSchemaTypes.String } when format == XMsFormat.DurationConstant => InputPrimitiveType.DurationConstant,
            { Type: AllSchemaTypes.String } when format == XMsFormat.ArmId => InputPrimitiveType.ResourceIdentifier,
            { Type: AllSchemaTypes.String } when format == XMsFormat.AzureLocation => InputPrimitiveType.AzureLocation,
            { Type: AllSchemaTypes.String } when format == XMsFormat.ContentType => InputPrimitiveType.ContentType,
            { Type: AllSchemaTypes.String } when format == XMsFormat.ETag => InputPrimitiveType.ETag,
            { Type: AllSchemaTypes.String } when format == XMsFormat.ResourceType => InputPrimitiveType.ResourceType,
            { Type: AllSchemaTypes.String } when format == XMsFormat.RequestMethod => InputPrimitiveType.RequestMethod,
            { Type: AllSchemaTypes.String } when format == XMsFormat.Object => InputPrimitiveType.Object,
            { Type: AllSchemaTypes.String } when format == XMsFormat.IPAddress => InputPrimitiveType.IPAddress,

            ConstantSchema constantSchema => CreateLiteralType(constantSchema, format, modelsCache),

            CredentialSchema => InputPrimitiveType.String,
            { Type: AllSchemaTypes.String } => InputPrimitiveType.String,
            { Type: AllSchemaTypes.Boolean } => InputPrimitiveType.Boolean,
            { Type: AllSchemaTypes.Uuid } => InputPrimitiveType.Guid,
            { Type: AllSchemaTypes.Uri } => InputPrimitiveType.Uri,

            ChoiceSchema choiceSchema => CreateEnumType(choiceSchema),
            SealedChoiceSchema choiceSchema => CreateEnumType(choiceSchema),

            ArraySchema array when IsDPG => new InputListType(array.Name, CreateType(array.ElementType, modelsCache, array.NullableItems ?? false), false),
            DictionarySchema dictionary when IsDPG => new InputDictionaryType(dictionary.Name, InputPrimitiveType.String, CreateType(dictionary.ElementType, modelsCache, dictionary.NullableItems ?? false), false),
            ObjectSchema objectSchema when IsDPG && modelsCache != null => modelsCache[objectSchema],

            AnySchema when IsDPG => InputIntrinsicType.Unknown,
            AnyObjectSchema when IsDPG => InputIntrinsicType.Unknown,

            _ => new CodeModelType(schema, false)
        };

        private static InputLiteralType CreateLiteralType(ConstantSchema constantSchema, string? format, IReadOnlyDictionary<ObjectSchema, InputModelType>? modelsCache)
        {
            var valueType = CreateType(constantSchema.ValueType, format, modelsCache);
            // normalize the value, because the "value" coming from the code model is always a string
            var kind = valueType switch
            {
                InputPrimitiveType primitiveType => primitiveType.Kind,
                InputEnumType enumType => enumType.EnumValueType.Kind,
                _ => throw new InvalidCastException($"Unknown value type {valueType.GetType()} for literal types")
            };
            var rawValue = constantSchema.Value.Value;
            object normalizedValue = kind switch
            {
                InputTypeKind.Boolean => bool.Parse(rawValue.ToString()!),
                InputTypeKind.Int32 => int.Parse(rawValue.ToString()!),
                InputTypeKind.Int64 => long.Parse(rawValue.ToString()!),
                InputTypeKind.Float32 => float.Parse(rawValue.ToString()!),
                InputTypeKind.Float64 => double.Parse(rawValue.ToString()!),
                _ => rawValue
            };

            return new InputLiteralType("Literal", valueType, normalizedValue, false);
        }

        public static InputEnumType CreateEnumType(SealedChoiceSchema schema)
            => CreateEnumType(schema, schema.ChoiceType, schema.Choices, false);

        public static InputEnumType CreateEnumType(ChoiceSchema schema)
            => CreateEnumType(schema, schema.ChoiceType, schema.Choices, true);

        private static InputEnumType CreateEnumType(Schema schema, PrimitiveSchema choiceType, IEnumerable<ChoiceValue> choices, bool isExtensible) => new(
            Name: schema.Name,
            Namespace: schema.Extensions?.Namespace,
            Accessibility: schema.Extensions?.Accessibility,
            Deprecated: schema.Deprecated?.Reason,
            Description: schema.CreateDescription(),
            Usage: InputModelTypeUsage.None,
            EnumValueType: (InputPrimitiveType)CreateType(choiceType, schema.Extensions?.Format, null),
            AllowedValues: choices.Select(CreateEnumValue).ToList(),
            IsExtensible: isExtensible,
            IsNullable: false
        );

        private static InputEnumTypeValue CreateEnumValue(ChoiceValue choiceValue) => new(
            Name: choiceValue.Language.Default.Name,
            Description: choiceValue.Language.Default.Description,
            Value: choiceValue.Value
        );

        public static RequestLocation GetRequestLocation(RequestParameter requestParameter) => requestParameter.In switch
        {
            HttpParameterIn.Uri => RequestLocation.Uri,
            HttpParameterIn.Path => RequestLocation.Path,
            HttpParameterIn.Query => RequestLocation.Query,
            HttpParameterIn.Header => RequestLocation.Header,
            HttpParameterIn.Body => RequestLocation.Body,
            _ => RequestLocation.None
        };

        private static bool IsDPG => !Configuration.Generation1ConvenienceClient && !Configuration.AzureArm;

        private InputConstant? GetDefaultValue(RequestParameter parameter)
        {
            if (parameter.ClientDefaultValue != null)
            {
                if (parameter.Origin == "modelerfour:synthesized/host" && (string)parameter.ClientDefaultValue == "")
                {
                    return null;
                }

                return new InputConstant(Value: parameter.ClientDefaultValue, Type: CreateType(parameter.Schema, _modelsCache, parameter.IsNullable));
            }

            if (parameter.Schema is ConstantSchema constantSchema)
            {
                return new InputConstant(Value: constantSchema.Value.Value, Type: CreateType(constantSchema.ValueType, _modelsCache, constantSchema.Value.Value == null));
            }

            return null;
        }

        public static IReadOnlyList<string> GetApiVersions(CodeModel codeModel)
            => codeModel.OperationGroups
                .SelectMany(g => g.Operations.SelectMany(o => o.ApiVersions))
                .Select(v => v.Version)
                .Distinct()
                .OrderBy(v => v)
                .ToList();

        private static InputAuth GetAuth(IEnumerable<SecurityScheme> securitySchemes)
        {
            InputApiKeyAuth? apiKey = null;
            InputOAuth2Auth? oAuth2 = null;

            foreach (var scheme in securitySchemes.Distinct(SecuritySchemesComparer.Instance))
            {
                switch (scheme)
                {
                    case AzureKeySecurityScheme:
                        throw new NotSupportedException($"{typeof(AzureKeySecurityScheme)} is not supported. Use {typeof(KeySecurityScheme)} instead");
                    case AADTokenSecurityScheme:
                        throw new NotSupportedException($"{typeof(AADTokenSecurityScheme)} is not supported. Use {typeof(OAuth2SecurityScheme)} instead");
                    case KeySecurityScheme when apiKey is not null:
                        // Tolerate second KeySecurityScheme to support TranslatorText: https://github.com/Azure/azure-rest-api-specs/blob/3196a62202976da192d6da86f44b02246ca2aa97/specification/cognitiveservices/data-plane/TranslatorText/stable/v3.0/TranslatorText.json#L14
                        // See https://github.com/Azure/autorest.csharp/issues/2637
                        //throw new NotSupportedException($"Only one {typeof(KeySecurityScheme)} is supported. Remove excess");
                        break;
                    case OAuth2SecurityScheme when oAuth2 is not null:
                        throw new NotSupportedException($"Only one {typeof(OAuth2SecurityScheme)} is not supported. Remove excess");
                    case KeySecurityScheme apiKeyScheme:
                        apiKey = new InputApiKeyAuth(apiKeyScheme.Name);
                        break;
                    case OAuth2SecurityScheme oAuth2Scheme:
                        oAuth2 = new InputOAuth2Auth(oAuth2Scheme.Scopes.ToList());
                        break;
                }
            }

            return new InputAuth(apiKey, oAuth2);
        }

        private class SecuritySchemesComparer : IEqualityComparer<SecurityScheme>
        {
            public static IEqualityComparer<SecurityScheme> Instance { get; } = new SecuritySchemesComparer();

            private SecuritySchemesComparer() { }

            public bool Equals(SecurityScheme? x, SecurityScheme? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (ReferenceEquals(x, null))
                {
                    return false;
                }

                if (ReferenceEquals(y, null))
                {
                    return false;
                }

                if (x.GetType() != y.GetType())
                {
                    return false;
                }

                return (x, y) switch
                {
                    (KeySecurityScheme apiKeyX, KeySecurityScheme apiKeyY)
                        => apiKeyX.Type == apiKeyY.Type && apiKeyX.Name == apiKeyY.Name,
                    (OAuth2SecurityScheme oAuth2X, OAuth2SecurityScheme oAuth2Y)
                        => oAuth2X.Type == oAuth2Y.Type && oAuth2X.Scopes.SequenceEqual(oAuth2Y.Scopes, StringComparer.Ordinal),
                    _ => x.Type == y.Type
                };
            }

            public int GetHashCode(SecurityScheme obj) =>
                obj switch
                {
                    AzureKeySecurityScheme azure => HashCode.Combine(azure.Type, azure.HeaderName),
                    AADTokenSecurityScheme aad => GetAADTokenSecurityHashCode(aad),
                    _ => HashCode.Combine(obj.Type)
                };

            private static int GetAADTokenSecurityHashCode(AADTokenSecurityScheme aad)
            {
                var hashCode = new HashCode();
                hashCode.Add(aad.Type);
                foreach (var value in aad.Scopes)
                {
                    hashCode.Add(value);
                }
                return hashCode.ToHashCode();
            }
        }

    }
}
