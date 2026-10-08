package streaming.sse.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * An instance of this class provides access to all the operations defined in Unnameds.
 */
public final class UnnamedsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final UnnamedsService service;

    /**
     * The service client containing this operation class.
     */
    private final SseClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UnnamedsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    UnnamedsImpl(SseClientImpl client) {
        this.service = UnnamedsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface UnnamedsService {
        static UnnamedsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new UnnamedsServiceImpl(pipeline);
        }

        Response<BinaryData> receive(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class UnnamedsServiceImpl implements UnnamedsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(UnnamedsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private UnnamedsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<BinaryData> receive(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(endpoint + "/streaming/sse/unnamed/receive");
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
                    io.clientcore.core.serialization.json.JsonSerializer.getInstance(), null, null, null,
                    UnnamedsServiceImpl.LOGGER);
            }
            return networkResponse;
        }
    }

    /**
     * The receive operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> receiveWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Unnamed.receive", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.receive(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(UnnamedsImpl.class);
}
