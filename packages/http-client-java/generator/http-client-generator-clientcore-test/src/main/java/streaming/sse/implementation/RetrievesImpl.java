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
import streaming.sse.retrieve.RetrievalRequest;

/**
 * An instance of this class provides access to all the operations defined in Retrieves.
 */
public final class RetrievesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RetrievesService service;

    /**
     * The service client containing this operation class.
     */
    private final SseClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RetrievesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RetrievesImpl(SseClientImpl client) {
        this.service = RetrievesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface RetrievesService {
        static RetrievesService getNewInstance(HttpPipeline pipeline) {
            return new RetrievesServiceImpl(pipeline);
        }

        Response<BinaryData> stream(String endpoint, String contentType, String accept, RetrievalRequest request,
            RequestContext requestContext);
    }

    private static final class RetrievesServiceImpl implements RetrievesService {
        private static final ClientLogger LOGGER = new ClientLogger(RetrievesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private RetrievesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<BinaryData> stream(String endpoint, String contentType, String accept, RetrievalRequest request,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/streaming/sse/retrieve/stream");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (request != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(request, this.jsonSerializer));
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
                    null, null, RetrievesServiceImpl.LOGGER);
            }
            return networkResponse;
        }
    }

    /**
     * The stream operation.
     * 
     * @param request The request parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> streamWithResponse(RetrievalRequest request, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Retrieve.stream", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "text/event-stream";
                return service.stream(this.client.getEndpoint(), contentType, accept, request, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(RetrievesImpl.class);
}
