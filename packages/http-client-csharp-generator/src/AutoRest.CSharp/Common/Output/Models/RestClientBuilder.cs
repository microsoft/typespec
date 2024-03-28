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
using Request = AutoRest.CSharp.Output.Models.Requests.Request;
using Response = AutoRest.CSharp.Output.Models.Responses.Response;
using StatusCodes = AutoRest.CSharp.Output.Models.Responses.StatusCodes;

namespace AutoRest.CSharp.Output.Models
{
    internal class RestClientBuilder
    {
        private static readonly HashSet<string> IgnoredRequestHeader = new(StringComparer.OrdinalIgnoreCase)
        {
            "x-ms-client-request-id",
            "tracestate",
            "traceparent"
        };

        private readonly OutputLibrary? _library;
        private readonly TypeFactory _typeFactory;
        private readonly Dictionary<string, Parameter> _parameters;


        public RestClientBuilder(IEnumerable<InputParameter> clientParameters, TypeFactory typeFactory)
        {
            _typeFactory = typeFactory;
            _parameters = clientParameters.DistinctBy(p => p.Name).ToDictionary(p => p.Name, BuildConstructorParameter);
        }

        public RestClientBuilder(IEnumerable<InputParameter> clientParameters, TypeFactory typeFactory, OutputLibrary library)
        {
            _typeFactory = typeFactory;
            _library = library;
            _parameters = clientParameters.ToDictionary(p => p.Name, BuildConstructorParameter);
        }

        /// <summary>
        /// Get sorted parameters, required parameters are at the beginning.
        /// </summary>
        /// <returns></returns>
        public Parameter[] GetOrderedParametersByRequired()
        {
            return OrderParametersByRequired(_parameters.Values);
        }

        public static IEnumerable<InputParameter> GetParametersFromOperations(IEnumerable<InputOperation> operations) =>
            operations
                .SelectMany(op => op.Parameters)
                .Where(p => p.Kind == InputOperationParameterKind.Client)
                .Distinct()
                .ToList();

        private static string GetRequestParameterName(RequestParameter requestParameter)
        {
            var language = requestParameter.Language.Default;
            return language.SerializedName ?? language.Name;
        }

        public static RestClientMethod BuildRequestMethod(InputOperation operation, Parameter[] parameters, IReadOnlyCollection<RequestPartSource> requestParts, Parameter? bodyParameter, TypeFactory typeFactory)
        {
            Request request = BuildRequest(operation, requestParts, bodyParameter);
            Response[] responses = BuildResponses(operation, typeFactory, out var responseType);

            return new RestClientMethod(
                operation.CleanName,
                operation.Summary != null ? BuilderHelpers.EscapeXmlDocDescription(operation.Summary) : null,
                BuilderHelpers.EscapeXmlDocDescription(operation.Description),
                responseType,
                request,
                parameters,
                responses,
                null,
                operation.BufferResponse,
                accessibility: operation.Accessibility ?? "public",
                operation
            );
        }

        /// <summary>
        /// Build RestClientMethod for HLC
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="responseHeaderModel"></param>
        /// <returns></returns>
        public RestClientMethod BuildMethod(InputOperation operation, DataPlaneResponseHeaderGroupType? responseHeaderModel)
        {
            var allParameters = GetOperationAllParameters(operation);
            var methodParameters = BuildMethodParameters(allParameters);
            var requestParts = allParameters
                .Select(kvp => new RequestPartSource(kvp.Key.NameInRequest, (InputParameter?)kvp.Key, CreateReference(kvp.Key, kvp.Value), kvp.Key.SerializationFormat))
                .ToList();

            var request = BuildRequest(operation, requestParts, null, _library);
            Response[] responses = BuildResponses(operation, _typeFactory, out var responseType);

            return new RestClientMethod(
                operation.CleanName,
                operation.Summary != null ? BuilderHelpers.EscapeXmlDocDescription(operation.Summary) : null,
                BuilderHelpers.EscapeXmlDocDescription(operation.Description),
                responseType,
                request,
                methodParameters,
                responses,
                responseHeaderModel,
                operation.BufferResponse,
                accessibility: operation.Accessibility ?? "public",
                operation
            );
        }

        private Dictionary<InputParameter, Parameter> GetOperationAllParameters(InputOperation operation)
            => FilterOperationAllParameters(operation.Parameters)
                .ToDictionary(p => p, parameter => BuildParameter(parameter));

        public static IEnumerable<InputParameter> FilterOperationAllParameters(IReadOnlyList<InputParameter> parameters)
            => parameters
                .Where(rp => !IsIgnoredHeaderParameter(rp))
                // change the type to constant so that it won't show up in the method signature
                .Select(p => RequestHeader.IsRepeatabilityRequestHeader(p.NameInRequest) || RequestHeader.IsClientRequestIdHeader(p.NameInRequest) ? p with { Kind = InputOperationParameterKind.Constant } : p);

        public static Response[] BuildResponses(InputOperation operation, TypeFactory typeFactory, out CSharpType? responseType)
        {
            if (operation.HttpMethod == RequestMethod.Head && Configuration.HeadAsBoolean)
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
            foreach (var response in operation.Responses.Where(r => !r.IsErrorResponse))
            {
                List<StatusCodes> statusCodes = new List<StatusCodes>();
                foreach (var statusCode in response.StatusCodes)
                {
                    statusCodes.Add(new StatusCodes(statusCode, null));
                }

                var responseBody = operation.LongRunning != null ? null : BuildResponseBody(response, typeFactory);
                clientResponse.Add(new Response(responseBody, statusCodes.ToArray()));
            }

            responseType = ReduceResponses(clientResponse);
            return clientResponse.ToArray();
        }

        private static Request BuildRequest(InputOperation operation, IReadOnlyCollection<RequestPartSource> requestParts, Parameter? bodyParameter, OutputLibrary? library = null)
        {
            var uriParametersMap = new Dictionary<string, PathSegment>();
            var pathParametersMap = new Dictionary<string, PathSegment>();
            var queryParameters = new List<QueryParameter>();
            var headerParameters = new List<RequestHeader>();
            foreach (var (parameterName, operationParameter, reference, serializationFormat) in requestParts)
            {
                if (operationParameter == null)
                {
                    Debug.Assert(parameterName == KnownParameters.MatchConditionsParameter.Name || parameterName == KnownParameters.RequestConditionsParameter.Name);
                    headerParameters.Add(new RequestHeader(parameterName, reference, null, serializationFormat));
                    continue;
                }

                var escape = !operationParameter.SkipUrlEncoding;

                switch (operationParameter.Location)
                {
                    case RequestLocation.Uri:
                        uriParametersMap.Add(parameterName, new PathSegment(reference, escape, serializationFormat, isRaw: true));
                        break;
                    case RequestLocation.Path:
                        pathParametersMap.Add(parameterName, new PathSegment(reference, escape, serializationFormat, isRaw: false));
                        break;
                    case RequestLocation.Query:
                        queryParameters.Add(new QueryParameter(parameterName, reference, operationParameter.ArraySerializationDelimiter, escape, serializationFormat, operationParameter.Explode, operationParameter.IsApiVersion));
                        break;
                    case RequestLocation.Header:
                        var headerName = operationParameter.HeaderCollectionPrefix ?? parameterName;
                        headerParameters.Add(new RequestHeader(headerName, reference, operationParameter.ArraySerializationDelimiter, serializationFormat));
                        break;
                }
            }

            var uriParameters = GetPathSegments(operation.Uri, uriParametersMap, isRaw: true);
            var pathParameters = GetPathSegments(operation.Path, pathParametersMap, isRaw: false);

            var body = bodyParameter != null
                ? new RequestContentRequestBody(bodyParameter)
                : operation.RequestBodyMediaType != BodyMediaType.None
                    ? BuildRequestBody(requestParts, operation.RequestBodyMediaType, library)
                    : null;

            return new Request(
                operation.HttpMethod,
                uriParameters.Concat(pathParameters).ToArray(),
                queryParameters.ToArray(),
                headerParameters.ToArray(),
                body
            );
        }

        protected virtual Parameter[] BuildMethodParameters(IReadOnlyDictionary<InputParameter, Parameter> allParameters)
        {
            List<Parameter> methodParameters = new();
            foreach (var (operationParameter, parameter) in allParameters)
            {
                // Grouped and flattened parameters shouldn't be added to methods
                if (operationParameter.Kind == InputOperationParameterKind.Method)
                {
                    methodParameters.Add(parameter);
                }
            }

            return OrderParametersByRequired(methodParameters);
        }

        private static RequestBody? BuildRequestBody(IReadOnlyCollection<RequestPartSource> allParameters, BodyMediaType bodyMediaType, OutputLibrary? library)
        {
            RequestBody? body = null;

            var references = new Dictionary<string, ReferenceOrConstant>();
            var bodyParameters = new List<(InputParameter, ReferenceOrConstant)>();
            foreach (var (_, inputParameter, value, _) in allParameters)
            {
                if (inputParameter is not null)
                {
                    references[inputParameter.NameInRequest] = value;
                }

                if (inputParameter is { Location: RequestLocation.Body })
                {
                    bodyParameters.Add((inputParameter, value));
                }
            }

            if (bodyParameters.Count > 0)
            {
                if (bodyMediaType == BodyMediaType.Multipart)
                {
                    List<MultipartRequestBodyPart> value = new List<MultipartRequestBodyPart>();
                    foreach (var (_, reference) in bodyParameters)
                    {
                        var type = reference.Type;
                        RequestBody requestBody;

                        if (type.Equals(typeof(string)))
                        {
                            requestBody = new TextRequestBody(reference);
                        }
                        else if (type.IsFrameworkType && type.FrameworkType == typeof(Stream))
                        {
                            requestBody = new BinaryRequestBody(reference);
                        }
                        else if (TypeFactory.IsList(type))
                        {
                            requestBody = new BinaryCollectionRequestBody(reference);
                        }
                        else
                        {
                            throw new NotImplementedException();
                        }

                        value.Add(new MultipartRequestBodyPart(reference.Reference.Name, requestBody));
                    }

                    body = new MultipartRequestBody(value.ToArray());
                }
                else if (bodyMediaType == BodyMediaType.Form)
                {
                    UrlEncodedBody urlbody = new UrlEncodedBody();
                    foreach (var (inputParameter, reference) in bodyParameters)
                    {
                        urlbody.Add(inputParameter.NameInRequest, reference);
                    }

                    body = urlbody;
                }
                else
                {
                    Debug.Assert(bodyParameters.Count == 1);
                    var (bodyRequestParameter, bodyParameterValue) = bodyParameters[0];
                    if (bodyMediaType == BodyMediaType.Binary ||
                        // WORKAROUND: https://github.com/Azure/autorest.modelerfour/issues/360
                        bodyRequestParameter.Type is InputPrimitiveType { Kind: InputTypeKind.Stream })
                    {
                        body = new BinaryRequestBody(bodyParameterValue);
                    }
                    else if (bodyMediaType == BodyMediaType.Text)
                    {
                        body = new TextRequestBody(bodyParameterValue);
                    }
                    else
                    {
                        var serialization = SerializationBuilder.Build(
                            bodyMediaType,
                            bodyRequestParameter.Type,
                            bodyParameterValue.Type,
                            null);

                        // This method has a flattened body
                        if (bodyRequestParameter.Kind == InputOperationParameterKind.Flattened && library != null)
                        {
                            var objectType = (SchemaObjectType)library.FindTypeForSchema(((CodeModelType)bodyRequestParameter.Type).Schema).Implementation;

                            var initializationMap = new List<ObjectPropertyInitializer>();
                            foreach ((_, InputParameter? inputParameter, _, _) in allParameters)
                            {
                                if (inputParameter is { VirtualParameter: { } virtualParameter })
                                {
                                    initializationMap.Add(new ObjectPropertyInitializer(objectType.GetPropertyForSchemaProperty(virtualParameter.TargetProperty, true), references[GetRequestParameterName(virtualParameter)].Reference));
                                }
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

        private ReferenceOrConstant CreateReference(InputParameter operationParameter, Parameter parameter)
        {
            if (operationParameter.Kind == InputOperationParameterKind.Client)
            {
                return (ReferenceOrConstant)_parameters[operationParameter.Name];
            }

            if (operationParameter is { Kind:InputOperationParameterKind.Constant } && parameter.DefaultValue is not null)
            {
                return (ReferenceOrConstant)parameter.DefaultValue;
            }

            var groupedByParameter = operationParameter.GroupedBy;
            if (groupedByParameter == null)
            {
                return parameter;
            }

            var groupModel = (SchemaObjectType)_typeFactory.CreateType(groupedByParameter.Type with {IsNullable = false}).Implementation;
            var property = groupModel.GetPropertyForGroupedParameter(operationParameter.Name);

            return new Reference($"{groupedByParameter.Name.ToVariableName()}.{property.Declaration.Name}", property.Declaration.Type);
        }

        private static ResponseBody? BuildResponseBody(OperationResponse response, TypeFactory typeFactory)
        {
            var bodyType = response.BodyType;
            if (bodyType == null)
            {
                return null;
            }

            if (response.BodyMediaType == BodyMediaType.Text)
            {
                return new StringResponseBody();
            }

            if (bodyType is InputPrimitiveType { Kind: InputTypeKind.Stream })
            {
                return new StreamResponseBody();
            }

            CSharpType responseType = TypeFactory.GetOutputType(typeFactory.CreateType(bodyType));
            ObjectSerialization serialization = SerializationBuilder.Build(response.BodyMediaType, bodyType, responseType, null);

            return new ObjectResponseBody(responseType, serialization);
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
        private static CSharpType? ReduceResponses(List<Response> responses)
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

        public virtual Parameter BuildConstructorParameter(InputParameter operationParameter)
        {
            var parameter = BuildParameter(operationParameter);
            if (!operationParameter.IsEndpoint)
            {
                return parameter;
            }

            var defaultValue = parameter.DefaultValue;
            var description = parameter.Description;
            var location = parameter.RequestLocation;

            return defaultValue != null
                ? KnownParameters.Endpoint with { Description = description, RequestLocation = location, DefaultValue = Constant.Default(new CSharpType(typeof(Uri), true)), Initializer = $"new {typeof(Uri)}({defaultValue.Value.GetConstantFormattable()})"}
                : KnownParameters.Endpoint with { Description = description, RequestLocation = location, Validation = parameter.Validation };
        }

        public static bool IsIgnoredHeaderParameter(InputParameter operationParameter)
            => operationParameter.Location == RequestLocation.Header && IgnoredRequestHeader.Contains(operationParameter.NameInRequest);

        private Parameter BuildParameter(in InputParameter operationParameter, Type? typeOverride = null)
        {
            CSharpType type = typeOverride != null ? new CSharpType(typeOverride, operationParameter.Type.IsNullable) : _typeFactory.CreateType(operationParameter.Type);
            return Parameter.FromInputParameter(operationParameter, type, _typeFactory);
        }

        public static RestClientMethod BuildNextPageMethod(RestClientMethod method)
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
            if (method.Operation.LongRunning != null)
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
    }

    internal record RequestPartSource(string NameInRequest, InputParameter? InputParameter, ReferenceOrConstant Reference, SerializationFormat SerializationFormat);
}
