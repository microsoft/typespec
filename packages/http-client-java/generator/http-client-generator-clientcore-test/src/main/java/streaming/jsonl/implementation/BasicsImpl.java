package streaming.jsonl.implementation;

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
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.GeneratedCodeUtils;

/**
 * An instance of this class provides access to all the operations defined in Basics.
 */
public final class BasicsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BasicsService service;

    /**
     * The service client containing this operation class.
     */
    private final JsonlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BasicsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BasicsImpl(JsonlClientImpl client) {
        this.service = BasicsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The HTTP operations for JsonlClientBasics.
     */
    public interface BasicsService {
        static BasicsService getNewInstance(HttpPipeline pipeline) {
            return new BasicsServiceImpl(pipeline);
        }

        Response<Void> send(String endpoint, String contentType, BinaryData body, long contentLength,
            RequestContext requestContext);

        Response<BinaryData> receive(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class BasicsServiceImpl implements BasicsService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(BasicsService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private BasicsServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> send(String endpoint, String contentType, BinaryData body, long contentLength,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/streaming/jsonl/basic/send");
            httpRequest.getHeaders().add(HttpHeaderName.fromString("Content-Length"), String.valueOf(contentLength));
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                if (body.getLength() != null) {
                    httpRequest.setBody(body);
                }
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<BinaryData> receive(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/streaming/jsonl/basic/receive");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return networkResponse;
        }
    }

    /**
     * The send operation.
     * 
     * @param body The body parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendWithResponse(BinaryData body, long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Jsonl.Basic.send", requestContext,
            updatedContext -> {
                final String contentType = "application/jsonl";
                return service.send(this.client.getEndpoint(), contentType, body, contentLength, updatedContext);
            });
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
        return this.instrumentation.instrumentWithResponse("Streaming.Jsonl.Basic.receive", requestContext,
            updatedContext -> {
                final String accept = "application/jsonl";
                return service.receive(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
