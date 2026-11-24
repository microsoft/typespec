package payload.contentnegotiation.implementation;

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
 * An instance of this class provides access to all the operations defined in SameBodies.
 */
public final class SameBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SameBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ContentNegotiationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of SameBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    SameBodiesImpl(ContentNegotiationClientImpl client) {
        this.service = SameBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The HTTP operations for ContentNegotiationClientSameBodies.
     */
    public interface SameBodiesService {
        static SameBodiesService getNewInstance(HttpPipeline pipeline) {
            return new SameBodiesServiceImpl(pipeline);
        }

        Response<BinaryData> getAvatarAsPng(String endpoint, String accept, RequestContext requestContext);

        Response<BinaryData> getAvatarAsJpeg(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class SameBodiesServiceImpl implements SameBodiesService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(SameBodiesService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private SameBodiesServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<BinaryData> getAvatarAsPng(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/content-negotiation/same-body");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("accept"), accept);
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

        @Override
        public Response<BinaryData> getAvatarAsJpeg(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/content-negotiation/same-body");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("accept"), accept);
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
     * The getAvatarAsPng operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getAvatarAsPngWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.ContentNegotiation.SameBody.getAvatarAsPng",
            requestContext, updatedContext -> {
                final String accept = "image/png";
                return service.getAvatarAsPng(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getAvatarAsJpeg operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getAvatarAsJpegWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.ContentNegotiation.SameBody.getAvatarAsJpeg",
            requestContext, updatedContext -> {
                final String accept = "image/jpeg";
                return service.getAvatarAsJpeg(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
