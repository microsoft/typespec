// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Responses;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using Operation = AutoRest.CSharp.Input.Operation;
using Request = AutoRest.CSharp.Output.Models.Requests.Request;
using Response = AutoRest.CSharp.Output.Models.Responses.Response;
using StatusCodes = AutoRest.CSharp.Output.Models.Responses.StatusCodes;

namespace AutoRest.CSharp.Output.Models
{
    internal class CmcRestClientBuilder
    {
        private static readonly HashSet<string> IgnoredRequestHeader = new(StringComparer.OrdinalIgnoreCase)
        {
            "x-ms-client-request-id",
            "tracestate",
            "traceparent"
        };

        private static readonly Dictionary<string, RequestConditionHeaders> ConditionRequestHeader = new(StringComparer.OrdinalIgnoreCase)
        {
            ["If-Match"] = RequestConditionHeaders.IfMatch,
            ["If-None-Match"] = RequestConditionHeaders.IfNoneMatch,
            ["If-Modified-Since"] = RequestConditionHeaders.IfModifiedSince,
            ["If-Unmodified-Since"] = RequestConditionHeaders.IfUnmodifiedSince
        };

        private readonly SerializationBuilder _serializationBuilder;
        protected readonly BuildContext _context;
        private readonly OutputLibrary _library;
        private readonly Dictionary<string, Parameter> _parameters;

        public CmcRestClientBuilder(IEnumerable<RequestParameter> clientParameters, BuildContext context)
        {
            _serializationBuilder = new SerializationBuilder();
            _context = context;
            _library = context.BaseLibrary!;
            _parameters = clientParameters.ToDictionary(p => p.Language.Default.Name, BuildConstructorParameter);
        }

        /// <summary>
        /// Get sorted parameters, required parameters are at the beginning.
        /// </summary>
        /// <returns></returns>
        public Parameter[] GetOrderedParametersByRequired()
        {
            return OrderParametersByRequired(_parameters.Values);
        }

        private static string GetRequestParameterName(RequestParameter requestParameter)
        {
            var language = requestParameter.Language.Default;
            return language.SerializedName ?? language.Name;
        }

        public IReadOnlyDictionary<string, (ReferenceOrConstant ReferenceOrConstant, bool SkipUrlEncoding)> GetReferencesToOperationParameters(Operation operation, IEnumerable<RequestParameter> requestParameters)
        {
            var allParameters = GetOperationAllParameters(operation, requestParameters);
            return allParameters.ToDictionary(kvp => GetRequestParameterName(kvp.Key), kvp => (CreateReference(kvp.Key, kvp.Value), kvp.Value.SkipUrlEncoding));
        }

        /// <summary>
        /// Build CmcRestClientMethod for mgmt and HLC
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="httpRequest"></param>
        /// <param name="requestParameters"></param>
        /// <param name="responseHeaderModel"></param>
        /// <param name="accessibility"></param>
        /// <param name="returnNullOn404Func"></param>
        /// <returns></returns>
        public RestClientMethod BuildMethod(Operation operation, HttpRequest httpRequest, IEnumerable<RequestParameter> requestParameters, DataPlaneResponseHeaderGroupType? responseHeaderModel, string accessibility, Func<string?, bool>? returnNullOn404Func = null)
        {
            var allParameters = GetOperationAllParameters(operation, requestParameters);
            var methodParameters = BuildMethodParameters(allParameters);
            var references = allParameters.ToDictionary(kvp => GetRequestParameterName(kvp.Key), kvp => new ParameterInfo(kvp.Key, CreateReference(kvp.Key, kvp.Value)));
            var request = BuildRequest(httpRequest, new RequestMethodBuildContext(methodParameters, references));

            var isHeadAsBoolean = request.HttpMethod == RequestMethod.Head && Configuration.HeadAsBoolean;
            Response[] responses = BuildResponses(operation, isHeadAsBoolean, out var responseType, returnNullOn404Func);

            return new RestClientMethod(
                operation.CSharpName(),
                BuilderHelpers.EscapeXmlDocDescription(operation.Language.Default.Summary ?? string.Empty),
                BuilderHelpers.EscapeXmlDocDescription(operation.Language.Default.Description),
                responseType,
                request,
                methodParameters,
                responses,
                responseHeaderModel,
                operation.Extensions?.BufferResponse ?? true,
                accessibility: accessibility,
                CreateInputOperation(operation)
            );
        }

        // TODO:
        // This is a temporary function that pass some properties from 'Operation' to 'InputOperation'.
        // Will be removed and re-use the `CodeModelConverter` once merged 2 builders together.
        private InputOperation CreateInputOperation(Operation operation)
        {
            foreach (var serviceRequest in operation.Requests)
            {
                if (serviceRequest.Protocol.Http is not HttpRequest httpRequest)
                {
                    continue;
                }
                return new InputOperation(
                    Name: operation.Language.Default.Name,
                    ResourceName: null,
                    Summary: operation.Language.Default.Summary,
                    Deprecated: operation.Deprecated?.Reason,
                    Description: operation.Language.Default.Description,
                    Accessibility: operation.Accessibility,
                    Parameters: CreateInputParameters(operation.Parameters.Concat(serviceRequest.Parameters).ToList()),
                    Responses: new List<OperationResponse>(),
                    HttpMethod: httpRequest.Method.ToCoreRequestMethod(),
                    RequestBodyMediaType: BodyMediaType.None,
                    Uri: httpRequest.Uri,
                    Path: httpRequest.Path,
                    ExternalDocsUrl: operation.ExternalDocs?.Url,
                    RequestMediaTypes: operation.RequestMediaTypes?.Keys.ToList(),
                    BufferResponse: operation.Extensions?.BufferResponse ?? true,
                    LongRunning: null,
                    Paging: CreateOperationPaging(operation),
                    GenerateProtocolMethod: true,
                    GenerateConvenienceMethod: false);
            }
            return new InputOperation();
        }

        private static IReadOnlyList<InputParameter> CreateInputParameters(IEnumerable<RequestParameter> requestParameters)
        {
            var parameters = new List<InputParameter>();
            foreach (var requestParameter in requestParameters)
            {
                parameters.Add(CreateInputParameter(requestParameter));
            }
            return parameters;
        }

        private static InputParameter CreateInputParameter(RequestParameter requestParameter)
        {
            return new(
                    Name: requestParameter.Language.Default.Name,
                    NameInRequest: requestParameter.Language.Default.SerializedName ?? requestParameter.Language.Default.Name,
                    Description: requestParameter.Language.Default.Description,
                    Type: CodeModelConverter.CreateType(requestParameter.Schema, requestParameter.Extensions?.Format, null) with { IsNullable = requestParameter.IsNullable || !requestParameter.IsRequired },
                    Location: CodeModelConverter.GetRequestLocation(requestParameter),
                    DefaultValue: GetDefaultValue(requestParameter),
                    IsRequired: requestParameter.IsRequired,
                    GroupedBy: requestParameter.GroupedBy != null ? CreateInputParameter(requestParameter.GroupedBy) : null,
                    Kind: CodeModelConverter.GetOperationParameterKind(requestParameter),
                    IsApiVersion: requestParameter.Origin == "modelerfour:synthesized/api-version",
                    IsResourceParameter: Convert.ToBoolean(requestParameter.Extensions.GetValue<string>("x-ms-resource-identifier")),
                    IsContentType: requestParameter.Origin == "modelerfour:synthesized/content-type",
                    IsEndpoint: requestParameter.Origin == "modelerfour:synthesized/host",
                    ArraySerializationDelimiter: GetArraySerializationDelimiter(requestParameter),
                    Explode: requestParameter.Protocol.Http is HttpParameter { Explode: true },
                    SkipUrlEncoding: requestParameter.Extensions?.SkipEncoding ?? false,
                    HeaderCollectionPrefix: requestParameter.Extensions?.HeaderCollectionPrefix,
                    VirtualParameter: requestParameter is VirtualParameter { Schema: not ConstantSchema } vp ? vp : null
                );
        }

        private static InputConstant? GetDefaultValue(RequestParameter parameter)
        {
            if (parameter.ClientDefaultValue != null)
            {
                return new InputConstant(Value: parameter.ClientDefaultValue, Type: CodeModelConverter.CreateType(parameter.Schema, parameter.Extensions?.Format, null) with { IsNullable = parameter.IsNullable });
            }

            if (parameter.Schema is ConstantSchema constantSchema)
            {
                return new InputConstant(Value: constantSchema.Value.Value, Type: CodeModelConverter.CreateType(constantSchema.ValueType, constantSchema.Extensions?.Format, null) with { IsNullable = constantSchema.Value.Value == null});
            }

            if (!parameter.IsRequired)
            {
                return new InputConstant(Value: null, Type: CodeModelConverter.CreateType(parameter.Schema, parameter.Extensions?.Format, null) with { IsNullable = parameter.IsNullable });
            }

            return null;
        }

        private OperationPaging? CreateOperationPaging(Operation operation)
        {
            var paging = operation.Language.Default.Paging;
            if (paging == null)
            {
                return null;
            }
            return new OperationPaging(NextLinkName: paging.NextLinkName, ItemName: paging.ItemName);
        }

        private Dictionary<RequestParameter, Parameter> GetOperationAllParameters(Operation operation, IEnumerable<RequestParameter> requestParameters)
        {
            var parameters = operation.Parameters
                .Concat(requestParameters)
                .Where(rp => !IsIgnoredHeaderParameter(rp))
                .ToArray();

            return parameters.ToDictionary(rp => rp, requestParameter => BuildParameter(requestParameter, null, operation.KeepClientDefaultValue));
        }

        private Response[] BuildResponses(Operation operation, bool headAsBoolean, out CSharpType? responseType, Func<string?, bool>? returnNullOn404Func = null)
        {
            if (headAsBoolean)
            {
                responseType = new CSharpType(typeof(bool));
                return new[]
                {
                    new Response(
                        new ConstantResponseBody(new Constant(true, responseType)),
                        new[] {new StatusCodes(null, 2)}),
                    new Response(
                        new ConstantResponseBody(new Constant(false, responseType)),
                        new[] {new StatusCodes(null, 4)}),
                };
            }

            List<Response> clientResponse = new List<Response>();
            foreach (var response in operation.Responses)
            {
                List<StatusCodes> statusCodes = new List<StatusCodes>();
                foreach (var statusCode in response.HttpResponse.IntStatusCodes)
                {
                    statusCodes.Add(new StatusCodes(statusCode, null));
                }

                clientResponse.Add(new Response(
                    operation.IsLongRunning ? null : BuildResponseBody(response),
                    statusCodes.ToArray()
                ));
            }

            if (returnNullOn404Func != null && returnNullOn404Func(clientResponse.FirstOrDefault()?.ResponseBody?.Type.Name))
                clientResponse.Add(new Response(null, new[] { new StatusCodes(404, null) }));

            responseType = ReduceResponses(clientResponse);
            return clientResponse.ToArray();
        }

        private Request BuildRequest(HttpRequest httpRequest, RequestMethodBuildContext buildContext)
        {
            var uriParametersMap = new Dictionary<string, PathSegment>();
            var pathParametersMap = new Dictionary<string, PathSegment>();
            var queryParameters = new List<QueryParameter>();
            var headerParameters = new List<RequestHeader>();
            foreach (var (parameterName, (requestParameter, reference)) in buildContext.References)
            {
                if (requestParameter == null)
                {
                    if (parameterName == KnownParameters.MatchConditionsParameter.Name || parameterName == KnownParameters.RequestConditionsParameter.Name)
                    {
                        headerParameters.Add(new RequestHeader(parameterName, reference, null, buildContext.ConditionalRequestSerializationFormat));
                    }
                    continue;
                }

                var serializationFormat = GetSerializationFormat(requestParameter);
                var escape = !requestParameter.Extensions!.SkipEncoding;

                switch (requestParameter.In)
                {
                    case HttpParameterIn.Uri:
                        uriParametersMap.Add(parameterName, new PathSegment(reference, escape, serializationFormat, isRaw: true));
                        break;
                    case HttpParameterIn.Path:
                        pathParametersMap.Add(parameterName, new PathSegment(reference, escape, serializationFormat, isRaw: false));
                        break;
                    case HttpParameterIn.Query:
                        queryParameters.Add(new QueryParameter(parameterName, reference, GetArraySerializationDelimiter(requestParameter), escape, serializationFormat, GetExplode(requestParameter), requestParameter.IsApiVersion));
                        break;
                    case HttpParameterIn.Header:
                        var headerName = requestParameter.Extensions?.HeaderCollectionPrefix ?? parameterName;
                        headerParameters.Add(new RequestHeader(headerName, reference, GetArraySerializationDelimiter(requestParameter), serializationFormat));
                        break;
                }
            }

            var uriParameters = GetPathSegments(httpRequest.Uri, uriParametersMap, isRaw: true);
            var pathParameters = GetPathSegments(httpRequest.Path, pathParametersMap, isRaw: false);

            var body = buildContext.BodyParameter != null
                ? new RequestContentRequestBody(buildContext.BodyParameter)
                : httpRequest is HttpWithBodyRequest httpWithBodyRequest
                    ? BuildRequestBody(buildContext.References, httpWithBodyRequest.KnownMediaType)
                    : null;

            return new Request(
                httpRequest.Method.ToCoreRequestMethod(),
                uriParameters.Concat(pathParameters).ToArray(),
                queryParameters.ToArray(),
                headerParameters.ToArray(),
                body
            );
        }

        protected virtual Parameter[] BuildMethodParameters(IReadOnlyDictionary<RequestParameter, Parameter> allParameters)
        {
            List<Parameter> methodParameters = new();
            foreach (var (requestParameter, parameter) in allParameters)
            {
                // Grouped and flattened parameters shouldn't be added to methods
                if (IsMethodParameter(requestParameter))
                {
                    methodParameters.Add(parameter);
                }
            }

            return OrderParametersByRequired(methodParameters);
        }

        private RequestBody? BuildRequestBody(IReadOnlyDictionary<string, ParameterInfo> allParameters, KnownMediaType mediaType)
        {
            RequestBody? body = null;

            Dictionary<RequestParameter, ReferenceOrConstant> bodyParameters = new();
            foreach (var (_, (requestParameter, value)) in allParameters)
            {
                if (requestParameter is { In: HttpParameterIn.Body })
                {
                    bodyParameters[requestParameter] = value;
                }
            }

            if (bodyParameters.Count > 0)
            {
                if (mediaType == KnownMediaType.Multipart)
                {
                    List<MultipartRequestBodyPart> value = new List<MultipartRequestBodyPart>();
                    foreach (var parameter in bodyParameters)
                    {
                        var type = parameter.Value.Type;
                        RequestBody requestBody;

                        if (type.Equals(typeof(string)))
                        {
                            requestBody = new TextRequestBody(parameter.Value);
                        }
                        else if (type.IsFrameworkType && type.FrameworkType == typeof(Stream))
                        {
                            requestBody = new BinaryRequestBody(parameter.Value);
                        }
                        else if (TypeFactory.IsList(type))
                        {
                            requestBody = new BinaryCollectionRequestBody(parameter.Value);
                        }
                        else
                        {
                            throw new NotImplementedException();
                        }

                        value.Add(new MultipartRequestBodyPart(parameter.Value.Reference.Name, requestBody));
                    }

                    body = new MultipartRequestBody(value.ToArray());
                }
                else if (mediaType == KnownMediaType.Form)
                {
                    UrlEncodedBody urlbody = new UrlEncodedBody();
                    foreach (var (bodyRequestParameter, bodyParameterValue) in bodyParameters)
                    {
                        urlbody.Add(GetRequestParameterName(bodyRequestParameter), bodyParameterValue);
                    }

                    body = urlbody;
                }
                else
                {
                    Debug.Assert(bodyParameters.Count == 1);
                    var (bodyRequestParameter, bodyParameterValue) = bodyParameters.Single();
                    if (mediaType == KnownMediaType.Binary ||
                        // WORKAROUND: https://github.com/Azure/autorest.modelerfour/issues/360
                        bodyRequestParameter.Schema is BinarySchema)
                    {
                        body = new BinaryRequestBody(bodyParameterValue);
                    }
                    else if (mediaType == KnownMediaType.Text)
                    {
                        body = new TextRequestBody(bodyParameterValue);
                    }
                    else
                    {
                        var serialization = _serializationBuilder.Build(
                            mediaType,
                            bodyRequestParameter.Schema,
                            bodyParameterValue.Type);

                        // This method has a flattened body
                        if (bodyRequestParameter.Flattened == true)
                        {
                            var objectType = (SchemaObjectType)_library.FindTypeForSchema(bodyRequestParameter.Schema).Implementation;

                            var initializationMap = new List<ObjectPropertyInitializer>();
                            foreach (var (parameter, _) in allParameters.Values)
                            {
                                if (parameter is not VirtualParameter virtualParameter || virtualParameter.Schema is ConstantSchema)
                                {
                                    continue;
                                }

                                initializationMap.Add(new ObjectPropertyInitializer(
                                    objectType.GetPropertyForSchemaProperty(virtualParameter.TargetProperty, true),
                                    allParameters[GetRequestParameterName(virtualParameter)].Reference));
                            }

                            body = new FlattenedSchemaRequestBody(objectType, initializationMap.ToArray(), serialization);
                        }
                        else
                        {
                            body = new SchemaRequestBody(bodyParameterValue, serialization);
                        }
                    }
                }
            }

            return body;
        }

        private ReferenceOrConstant CreateReference(RequestParameter requestParameter, Parameter parameter)
        {
            if (requestParameter.Implementation != ImplementationLocation.Method)
            {
                return (ReferenceOrConstant)_parameters[requestParameter.Language.Default.Name];
            }

            if (requestParameter.Schema is ConstantSchema constant && requestParameter.IsRequired)
            {
                return ParseConstant(constant);
            }

            var groupedByParameter = requestParameter.GroupedBy;
            if (groupedByParameter == null)
            {
                return parameter;
            }

            var groupModel = (SchemaObjectType)_context.TypeFactory.CreateType(groupedByParameter.Schema, false).Implementation;
            var property = groupModel.GetPropertyForGroupedParameter(requestParameter.Language.Default.Name);

            return new Reference($"{groupedByParameter.CSharpName()}.{property.Declaration.Name}", property.Declaration.Type);
        }

        private static SerializationFormat GetSerializationFormat(RequestParameter requestParameter)
            => BuilderHelpers.GetSerializationFormat(GetValueSchema(requestParameter));

        private ResponseBody? BuildResponseBody(ServiceResponse response)
        {
            if (response.HttpResponse.KnownMediaType == KnownMediaType.Text)
            {
                return new StringResponseBody();
            }
            else if (response is SchemaResponse schemaResponse)
            {
                Schema schema = schemaResponse.Schema is ConstantSchema constantSchema ? constantSchema.ValueType : schemaResponse.Schema;
                CSharpType responseType = TypeFactory.GetOutputType(_context.TypeFactory.CreateType(schema, isNullable: schemaResponse.IsNullable));

                ObjectSerialization serialization = _serializationBuilder.Build(response.HttpResponse.KnownMediaType, schema, responseType);

                return new ObjectResponseBody(responseType, serialization);
            }
            else if (response is BinaryResponse)
            {
                return new StreamResponseBody();
            }

            return null;
        }

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

        private static bool GetExplode(RequestParameter requestParameter) => requestParameter.Protocol.Http is HttpParameter httpParameter && httpParameter.Explode == true;

        private static Schema GetValueSchema(RequestParameter requestParameter)
        {
            Schema valueSchema = requestParameter.Schema;
            return requestParameter.Schema is ConstantSchema constant
                ? constant.ValueType
                : valueSchema;
        }

        private static IEnumerable<PathSegment> GetPathSegments(string httpRequestUri, IReadOnlyDictionary<string, PathSegment> parameters, bool isRaw)
        {
            var segments = new List<PathSegment>();

            foreach ((ReadOnlySpan<char> span, bool isLiteral) in StringExtensions.GetPathParts(httpRequestUri))
            {
                var text = span.ToString();
                if (isLiteral)
                {
                    segments.Add(new PathSegment(BuilderHelpers.StringConstant(text), false, SerializationFormat.Default, isRaw));
                }
                else
                {
                    if (parameters.TryGetValue(text, out var parameter))
                    {
                        segments.Add(parameter);
                    }
                    else
                    {
                        ErrorHelpers.ThrowError($"\n\nError while processing request '{httpRequestUri}'\n\n  '{text}' in URI is missing a matching definition in the path parameters collection{ErrorHelpers.UpdateSwaggerOrFile}");
                    }
                }
            }

            return segments;
        }

        /// <summary>
        /// Sort the parameters, move required parameters at the beginning, in order.
        /// </summary>
        /// <param name="parameters">Parameters to sort</param>
        /// <returns></returns>
        private static Parameter[] OrderParametersByRequired(IEnumerable<Parameter> parameters) => parameters.OrderBy(p => p.IsOptionalInSignature).ToArray();

        // Merges operations without response types types together
        private CSharpType? ReduceResponses(List<Response> responses)
        {
            foreach (var typeGroup in responses.GroupBy(r => r.ResponseBody))
            {
                foreach (var individualResponse in typeGroup)
                {
                    responses.Remove(individualResponse);
                }

                responses.Add(new Response(
                    typeGroup.Key,
                    typeGroup.SelectMany(r => r.StatusCodes).Distinct().ToArray()));
            }

            var bodyTypes = responses.Select(r => r.ResponseBody?.Type)
                .OfType<CSharpType>()
                .Distinct()
                .ToArray();

            return bodyTypes.Length switch
            {
                0 => null,
                1 => bodyTypes[0],
                _ => typeof(object)
            };
        }

        public virtual Parameter BuildConstructorParameter(RequestParameter requestParameter)
        {
            var parameter = BuildParameter(requestParameter);
            if (!IsEndpointParameter(requestParameter))
            {
                return parameter;
            }

            var name = "endpoint";
            var type = new CSharpType(typeof(Uri));
            var defaultValue = parameter.DefaultValue;
            var description = parameter.Description;
            var location = parameter.RequestLocation;

            return defaultValue != null
                ? new Parameter(name, description, type, Constant.Default(type.WithNullable(true)), ValidationType.None, $"new {typeof(Uri)}({defaultValue.Value.GetConstantFormattable()})", RequestLocation: location)
                : new Parameter(name, description, type, null, parameter.Validation, null, RequestLocation: location);
        }

        protected static bool IsMethodParameter(RequestParameter requestParameter)
            => requestParameter.Implementation == ImplementationLocation.Method &&
                (requestParameter.Schema is not ConstantSchema || !requestParameter.IsRequired) && // we should put the parameter in signature when it is not Constant or "it is Constant, but it is optional"
                !requestParameter.IsFlattened && requestParameter.GroupedBy == null;

        public static bool IsEndpointParameter(RequestParameter requestParameter)
            => requestParameter.Origin == "modelerfour:synthesized/host";

        public static bool IsContentTypeParameter(RequestParameter requestParameter)
            => requestParameter.Origin == "modelerfour:synthesized/content-type";

        public static bool IsIgnoredHeaderParameter(RequestParameter requestParameter)
            => requestParameter.In == HttpParameterIn.Header && IgnoredRequestHeader.Contains(GetRequestParameterName(requestParameter));

        private static bool IsRequestConditionHeader(RequestParameter requestParameter, out RequestConditionHeaders header)
        {
            header = RequestConditionHeaders.None;
            return requestParameter.In == HttpParameterIn.Header && ConditionRequestHeader.TryGetValue(GetRequestParameterName(requestParameter), out header);
        }

        private Parameter BuildParameter(in RequestParameter requestParameter, Type? typeOverride = null, bool keepClientDefaultValue = false)
        {
            var isNullable = requestParameter.IsNullable || !requestParameter.IsRequired;
            CSharpType type = typeOverride != null
                ? new CSharpType(typeOverride, isNullable)
                : _context.TypeFactory.CreateType(requestParameter.Schema, requestParameter.Extensions?.Format, isNullable);
            return Parameter.FromRequestParameter(requestParameter, type, _context.TypeFactory, keepClientDefaultValue);
        }

        private Constant ParseConstant(ConstantSchema constant) =>
            BuilderHelpers.ParseConstant(constant.Value.Value, _context.TypeFactory.CreateType(constant.ValueType, constant.Value.Value == null));

        public static RestClientMethod BuildNextPageMethod(Operation operation, RestClientMethod method)
        {
            var nextPageUrlParameter = new Parameter(
                "nextLink",
                $"The URL to the next page of results.",
                typeof(string),
                DefaultValue: null,
                ValidationType.AssertNotNull,
                null);

            PathSegment[] pathSegments = method.Request.PathSegments
                .Where(ps => ps.IsRaw)
                .Append(new PathSegment(nextPageUrlParameter, false, SerializationFormat.Default, isRaw: true))
                .ToArray();

            var request = new Request(
                RequestMethod.Get,
                pathSegments,
                Array.Empty<QueryParameter>(),
                method.Request.Headers,
                null);

            Parameter[] parameters = method.Parameters.Where(p => p.Name != nextPageUrlParameter.Name)
                .Prepend(nextPageUrlParameter)
                .ToArray();

            var responses = method.Responses;

            // We hardcode 200 as expected response code for paged LRO results
            if (operation.IsLongRunning)
            {
                responses = new[]
                {
                    new Response(null, new[] { new StatusCodes(200, null) })
                };
            }

            return new RestClientMethod(
                $"{method.Name}NextPage",
                method.Summary,
                method.Description,
                method.ReturnType,
                request,
                parameters,
                responses,
                method.HeaderModel,
                bufferResponse: true,
                accessibility: "internal",
                method.Operation);
        }

        public static IEnumerable<Parameter> GetRequiredParameters(IEnumerable<Parameter> parameters)
            => parameters.Where(parameter => !parameter.IsOptionalInSignature).ToList();

        public static IEnumerable<Parameter> GetOptionalParameters(IEnumerable<Parameter> parameters, bool includeAPIVersion = false)
            => parameters.Where(parameter => parameter.IsOptionalInSignature && (includeAPIVersion || !parameter.IsApiVersionParameter)).ToList();

        public static IReadOnlyCollection<Parameter> GetConstructorParameters(IReadOnlyList<Parameter> parameters, CSharpType? credentialType, bool includeAPIVersion = false)
        {
            var constructorParameters = new List<Parameter>();

            constructorParameters.AddRange(GetRequiredParameters(parameters));

            if (credentialType != null)
            {
                var credentialParam = new Parameter(
                    "credential",
                    $"A credential used to authenticate to an Azure Service.",
                    credentialType,
                    null,
                    ValidationType.AssertNotNull,
                    null);
                constructorParameters.Add(credentialParam);
            }

            constructorParameters.AddRange(GetOptionalParameters(parameters, includeAPIVersion));

            return constructorParameters;
        }

        private record RequestMethodBuildContext(IReadOnlyList<Parameter> OrderedParameters, IReadOnlyDictionary<string, ParameterInfo> References, Parameter? BodyParameter = null, SerializationFormat ConditionalRequestSerializationFormat = SerializationFormat.Default, RequestConditionHeaders RequestConditionFlag = RequestConditionHeaders.None);

        private readonly record struct ParameterInfo(RequestParameter? Parameter, ReferenceOrConstant Reference);
    }
}
