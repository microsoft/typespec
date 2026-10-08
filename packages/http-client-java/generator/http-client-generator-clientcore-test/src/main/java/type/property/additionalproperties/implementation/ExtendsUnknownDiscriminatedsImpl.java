package type.property.additionalproperties.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import type.property.additionalproperties.ExtendsUnknownAdditionalPropertiesDiscriminated;

/**
 * An instance of this class provides access to all the operations defined in ExtendsUnknownDiscriminateds.
 */
public final class ExtendsUnknownDiscriminatedsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExtendsUnknownDiscriminatedsService service;

    /**
     * The service client containing this operation class.
     */
    private final AdditionalPropertiesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtendsUnknownDiscriminatedsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExtendsUnknownDiscriminatedsImpl(AdditionalPropertiesClientImpl client) {
        this.service = ExtendsUnknownDiscriminatedsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ExtendsUnknownDiscriminatedsService {
        static ExtendsUnknownDiscriminatedsService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ExtendsUnknownDiscriminatedsServiceImpl(pipeline);
        }

        Response<ExtendsUnknownAdditionalPropertiesDiscriminated> get(String endpoint, String accept,
            RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ExtendsUnknownAdditionalPropertiesDiscriminated body,
            RequestContext requestContext);
    }

    private static final class ExtendsUnknownDiscriminatedsServiceImpl implements ExtendsUnknownDiscriminatedsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(
                ExtendsUnknownDiscriminatedsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private ExtendsUnknownDiscriminatedsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ExtendsUnknownAdditionalPropertiesDiscriminated> get(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(endpoint + "/type/property/additionalProperties/extendsUnknownDiscriminated");
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, ExtendsUnknownDiscriminatedsServiceImpl.LOGGER);
            }
            try {
                ExtendsUnknownAdditionalPropertiesDiscriminated deserializedResult;
                deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                    networkResponse.getValue(), this.jsonSerializer,
                    io.clientcore.core.utils.CoreUtils.createParameterizedType(
                        io.clientcore.core.http.models.Response.class,
                        ExtendsUnknownAdditionalPropertiesDiscriminated.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> put(String endpoint, String contentType,
            ExtendsUnknownAdditionalPropertiesDiscriminated body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(endpoint + "/type/property/additionalProperties/extendsUnknownDiscriminated");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, ExtendsUnknownDiscriminatedsServiceImpl.LOGGER);
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
     * Get call.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ExtendsUnknownAdditionalPropertiesDiscriminated> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsUnknownDiscriminated.get", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(ExtendsUnknownAdditionalPropertiesDiscriminated body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsUnknownDiscriminated.put", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.put(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ExtendsUnknownDiscriminatedsImpl.class);
}
