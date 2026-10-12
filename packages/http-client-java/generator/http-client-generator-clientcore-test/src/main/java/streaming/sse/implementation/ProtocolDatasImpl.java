package streaming.sse.implementation;

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

/**
 * An instance of this class provides access to all the operations defined in ProtocolDatas.
 */
public final class ProtocolDatasImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ProtocolDatasService service;

    /**
     * The service client containing this operation class.
     */
    private final SseClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ProtocolDatasImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ProtocolDatasImpl(SseClientImpl client) {
        this.service = ProtocolDatasService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ProtocolDatasService {
        static ProtocolDatasService getNewInstance(HttpPipeline pipeline) {
            return new ProtocolDatasServiceImpl(pipeline);
        }

        Response<BinaryData> withEnvelope(String endpoint, String accept, RequestContext requestContext);

        Response<BinaryData> withoutEnvelope(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class ProtocolDatasServiceImpl implements ProtocolDatasService {
        private static final ClientLogger LOGGER = new ClientLogger(ProtocolDatasServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private ProtocolDatasServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<BinaryData> withEnvelope(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/streaming/sse/protocol/data/with-envelope");
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ProtocolDatasServiceImpl.LOGGER);
            }
            return networkResponse;
        }

        @Override
        public Response<BinaryData> withoutEnvelope(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/streaming/sse/protocol/data/without-envelope");
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ProtocolDatasServiceImpl.LOGGER);
            }
            return networkResponse;
        }
    }

    /**
     * The withEnvelope operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> withEnvelopeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.Data.withEnvelope", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.withEnvelope(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The withoutEnvelope operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> withoutEnvelopeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.Data.withoutEnvelope",
            requestContext, updatedContext -> {
                final String accept = "text/event-stream";
                return service.withoutEnvelope(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ProtocolDatasImpl.class);
}
