package parameters.spread.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import java.util.List;
import parameters.spread.alias.implementation.SpreadAsRequestBodyRequest;

/**
 * An instance of this class provides access to all the operations defined in Alias.
 */
public final class AliasImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final AliasService service;

    /**
     * The service client containing this operation class.
     */
    private final SpreadClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of AliasImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    AliasImpl(SpreadClientImpl client) {
        this.service = AliasService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface AliasService {
        static AliasService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new AliasServiceImpl(pipeline);
        }

        Response<Void> spreadAsRequestBody(String endpoint, String contentType,
            SpreadAsRequestBodyRequest spreadAsRequestBodyRequest, RequestContext requestContext);

        Response<Void> spreadParameterWithInnerModel(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadParameterWithInnerModelRequest spreadParameterWithInnerModelRequest,
            RequestContext requestContext);

        Response<Void> spreadAsRequestParameter(String endpoint, String id, String xMsTestHeader, String contentType,
            SpreadAsRequestParameterRequest spreadAsRequestParameterRequest, RequestContext requestContext);

        Response<Void> spreadWithMultipleParameters(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadWithMultipleParametersRequest spreadWithMultipleParametersRequest,
            RequestContext requestContext);

        Response<Void> spreadParameterWithInnerAlias(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadParameterWithInnerAliasRequest spreadParameterWithInnerAliasRequest,
            RequestContext requestContext);
    }

    private static final class AliasServiceImpl implements AliasService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(AliasServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private AliasServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> spreadAsRequestBody(String endpoint, String contentType,
            SpreadAsRequestBodyRequest spreadAsRequestBodyRequest, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/spread/alias/request-body");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadAsRequestBodyRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(spreadAsRequestBodyRequest,
                        this.xmlSerializer.supportsFormat(requestSerializationFormat)
                            ? this.xmlSerializer
                            : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AliasServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadParameterWithInnerModel(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadParameterWithInnerModelRequest spreadParameterWithInnerModelRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/spread/alias/inner-model-parameter/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(id));
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (xMsTestHeader != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("x-ms-test-header"), xMsTestHeader);
            }
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadParameterWithInnerModelRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(
                    io.clientcore.core.models.binarydata.BinaryData.fromObject(spreadParameterWithInnerModelRequest,
                        this.xmlSerializer.supportsFormat(requestSerializationFormat)
                            ? this.xmlSerializer
                            : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AliasServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadAsRequestParameter(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadAsRequestParameterRequest spreadAsRequestParameterRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/spread/alias/request-parameter/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(id));
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (xMsTestHeader != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("x-ms-test-header"), xMsTestHeader);
            }
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadAsRequestParameterRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(spreadAsRequestParameterRequest,
                        this.xmlSerializer.supportsFormat(requestSerializationFormat)
                            ? this.xmlSerializer
                            : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AliasServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadWithMultipleParameters(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadWithMultipleParametersRequest spreadWithMultipleParametersRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/spread/alias/multiple-parameters/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(id));
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (xMsTestHeader != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("x-ms-test-header"), xMsTestHeader);
            }
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadWithMultipleParametersRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(
                    io.clientcore.core.models.binarydata.BinaryData.fromObject(spreadWithMultipleParametersRequest,
                        this.xmlSerializer.supportsFormat(requestSerializationFormat)
                            ? this.xmlSerializer
                            : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AliasServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadParameterWithInnerAlias(String endpoint, String id, String xMsTestHeader,
            String contentType, SpreadParameterWithInnerAliasRequest spreadParameterWithInnerAliasRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/spread/alias/inner-alias-parameter/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(id));
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (xMsTestHeader != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("x-ms-test-header"), xMsTestHeader);
            }
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadParameterWithInnerAliasRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(
                    io.clientcore.core.models.binarydata.BinaryData.fromObject(spreadParameterWithInnerAliasRequest,
                        this.xmlSerializer.supportsFormat(requestSerializationFormat)
                            ? this.xmlSerializer
                            : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AliasServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The spreadAsRequestBody operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadAsRequestBodyWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Alias.spreadAsRequestBody",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadAsRequestBodyRequest spreadAsRequestBodyRequest = new SpreadAsRequestBodyRequest(name);
                return service.spreadAsRequestBody(this.client.getEndpoint(), contentType, spreadAsRequestBodyRequest,
                    updatedContext);
            });
    }

    /**
     * The spreadParameterWithInnerModel operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadParameterWithInnerModelWithResponse(String id, String xMsTestHeader, String name,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Alias.spreadParameterWithInnerModel",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadParameterWithInnerModelRequest spreadParameterWithInnerModelRequest
                    = new SpreadParameterWithInnerModelRequest(name);
                return service.spreadParameterWithInnerModel(this.client.getEndpoint(), id, xMsTestHeader, contentType,
                    spreadParameterWithInnerModelRequest, updatedContext);
            });
    }

    /**
     * The spreadAsRequestParameter operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadAsRequestParameterWithResponse(String id, String xMsTestHeader, String name,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Alias.spreadAsRequestParameter",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadAsRequestParameterRequest spreadAsRequestParameterRequest
                    = new SpreadAsRequestParameterRequest(name);
                return service.spreadAsRequestParameter(this.client.getEndpoint(), id, xMsTestHeader, contentType,
                    spreadAsRequestParameterRequest, updatedContext);
            });
    }

    /**
     * The spreadWithMultipleParameters operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param requiredString required string.
     * @param requiredIntList required int.
     * @param optionalInt optional int.
     * @param optionalStringList optional string.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadWithMultipleParametersWithResponse(String id, String xMsTestHeader,
        String requiredString, List<Integer> requiredIntList, Integer optionalInt, List<String> optionalStringList,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Alias.spreadWithMultipleParameters",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadWithMultipleParametersRequest spreadWithMultipleParametersRequest
                    = new SpreadWithMultipleParametersRequest(requiredString, requiredIntList);
                spreadWithMultipleParametersRequest.setOptionalInt(optionalInt);
                spreadWithMultipleParametersRequest.setOptionalStringList(optionalStringList);
                return service.spreadWithMultipleParameters(this.client.getEndpoint(), id, xMsTestHeader, contentType,
                    spreadWithMultipleParametersRequest, updatedContext);
            });
    }

    /**
     * spread an alias with contains another alias property as body.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name name of the Thing.
     * @param age age of the Thing.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadParameterWithInnerAliasWithResponse(String id, String xMsTestHeader, String name,
        int age, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Alias.spreadParameterWithInnerAlias",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadParameterWithInnerAliasRequest spreadParameterWithInnerAliasRequest
                    = new SpreadParameterWithInnerAliasRequest(name, age);
                return service.spreadParameterWithInnerAlias(this.client.getEndpoint(), id, xMsTestHeader, contentType,
                    spreadParameterWithInnerAliasRequest, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(AliasImpl.class);
}
