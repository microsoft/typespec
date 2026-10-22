package type.property.additionalproperties.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import type.property.additionalproperties.DifferentSpreadModelDerived;

/**
 * An instance of this class provides access to all the operations defined in ExtendsDifferentSpreadModels.
 */
public final class ExtendsDifferentSpreadModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExtendsDifferentSpreadModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final AdditionalPropertiesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtendsDifferentSpreadModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExtendsDifferentSpreadModelsImpl(AdditionalPropertiesClientImpl client) {
        this.service = ExtendsDifferentSpreadModelsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ExtendsDifferentSpreadModelsService {
        static ExtendsDifferentSpreadModelsService getNewInstance(HttpPipeline pipeline) {
            return new ExtendsDifferentSpreadModelsServiceImpl(pipeline);
        }

        Response<DifferentSpreadModelDerived> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, DifferentSpreadModelDerived body,
            RequestContext requestContext);
    }

    private static final class ExtendsDifferentSpreadModelsServiceImpl implements ExtendsDifferentSpreadModelsService {
        private static final ClientLogger LOGGER = new ClientLogger(ExtendsDifferentSpreadModelsServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private ExtendsDifferentSpreadModelsServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<DifferentSpreadModelDerived> get(String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/type/property/additionalProperties/extendsDifferentSpreadModel");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ExtendsDifferentSpreadModelsServiceImpl.LOGGER);
            }
            try {
                DifferentSpreadModelDerived deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, DifferentSpreadModelDerived.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, DifferentSpreadModelDerived body,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/type/property/additionalProperties/extendsDifferentSpreadModel");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ExtendsDifferentSpreadModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
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
    public Response<DifferentSpreadModelDerived> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsDifferentSpreadModel.get", requestContext, updatedContext -> {
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
    public Response<Void> putWithResponse(DifferentSpreadModelDerived body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsDifferentSpreadModel.put", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.put(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ExtendsDifferentSpreadModelsImpl.class);
}
