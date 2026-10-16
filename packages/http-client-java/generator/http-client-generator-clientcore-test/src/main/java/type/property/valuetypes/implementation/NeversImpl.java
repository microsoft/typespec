package type.property.valuetypes.implementation;

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
import type.property.valuetypes.NeverProperty;

/**
 * An instance of this class provides access to all the operations defined in Nevers.
 */
public final class NeversImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NeversService service;

    /**
     * The service client containing this operation class.
     */
    private final ValueTypesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NeversImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NeversImpl(ValueTypesClientImpl client) {
        this.service = NeversService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface NeversService {
        static NeversService getNewInstance(HttpPipeline pipeline) {
            return new NeversServiceImpl(pipeline);
        }

        Response<NeverProperty> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, NeverProperty body, RequestContext requestContext);
    }

    private static final class NeversServiceImpl implements NeversService {
        private static final ClientLogger LOGGER = new ClientLogger(NeversServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private NeversServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<NeverProperty> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/type/property/value-types/never");
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
                    null, null, NeversServiceImpl.LOGGER);
            }
            try {
                NeverProperty deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, NeverProperty.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, NeverProperty body,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/type/property/value-types/never");
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
                    null, null, NeversServiceImpl.LOGGER);
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
    public Response<NeverProperty> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.ValueTypes.Never.get", requestContext,
            updatedContext -> {
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
    public Response<Void> putWithResponse(NeverProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.ValueTypes.Never.put", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.put(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(NeversImpl.class);
}
