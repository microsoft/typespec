package versioning.added.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import versioning.added.AddedServiceVersion;
import versioning.added.ModelV1;
import versioning.added.ModelV2;

/**
 * Initializes a new instance of the AddedClient type.
 */
public final class AddedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final AddedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Service version.
     */
    private final AddedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public AddedServiceVersion getServiceVersion() {
        return this.serviceVersion;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * The InterfaceV2sImpl object to access its operations.
     */
    private final InterfaceV2sImpl interfaceV2s;

    /**
     * Gets the InterfaceV2sImpl object to access its operations.
     * 
     * @return the InterfaceV2sImpl object.
     */
    public InterfaceV2sImpl getInterfaceV2s() {
        return this.interfaceV2s;
    }

    /**
     * Initializes an instance of AddedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public AddedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        AddedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.interfaceV2s = new InterfaceV2sImpl(this);
        this.service = AddedClientService.getNewInstance(this.httpPipeline);
    }

    public interface AddedClientService {
        static AddedClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new AddedClientServiceImpl(pipeline);
        }

        Response<ModelV1> v1(String endpoint, String version, String headerV2, String contentType, String accept,
            ModelV1 body, RequestContext requestContext);

        Response<ModelV2> v2(String endpoint, String version, String contentType, String accept, ModelV2 body,
            RequestContext requestContext);
    }

    private static final class AddedClientServiceImpl implements AddedClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(AddedClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private AddedClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelV1> v1(String endpoint, String version, String headerV2, String contentType, String accept,
            ModelV1 body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/versioning/added/api-version:"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(version) + "/v1");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (headerV2 != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("header-v2"), headerV2);
            }
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body,
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
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AddedClientServiceImpl.LOGGER);
            }
            try {
                ModelV1 deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, ModelV1.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, ModelV1.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<ModelV2> v2(String endpoint, String version, String contentType, String accept, ModelV2 body,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/versioning/added/api-version:"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(version) + "/v2");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body,
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
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, AddedClientServiceImpl.LOGGER);
            }
            try {
                ModelV2 deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, ModelV2.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, ModelV2.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV1> v1WithResponse(String headerV2, ModelV1 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Added.v1", requestContext, updatedContext -> {
            final String contentType = "application/json";
            final String accept = "application/json";
            return service.v1(this.getEndpoint(), this.getServiceVersion().getVersion(), headerV2, contentType, accept,
                body, updatedContext);
        });
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV2> v2WithResponse(ModelV2 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Added.v2", requestContext, updatedContext -> {
            final String contentType = "application/json";
            final String accept = "application/json";
            return service.v2(this.getEndpoint(), this.getServiceVersion().getVersion(), contentType, accept, body,
                updatedContext);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(AddedClientImpl.class);
}
