package specialheaders.repeatability.implementation;

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
import io.clientcore.core.utils.DateTimeRfc1123;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Initializes a new instance of the RepeatabilityClient type.
 */
public final class RepeatabilityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RepeatabilityClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
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
     * Initializes an instance of RepeatabilityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public RepeatabilityClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = RepeatabilityClientService.getNewInstance(this.httpPipeline);
    }

    public interface RepeatabilityClientService {
        static RepeatabilityClientService getNewInstance(HttpPipeline pipeline) {
            return new RepeatabilityClientServiceImpl(pipeline);
        }

        Response<Void> immediateSuccess(String endpoint, String repeatabilityRequestId, String repeatabilityFirstSent,
            RequestContext requestContext);
    }

    private static final class RepeatabilityClientServiceImpl implements RepeatabilityClientService {
        private static final ClientLogger LOGGER = new ClientLogger(RepeatabilityClientServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private RepeatabilityClientServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> immediateSuccess(String endpoint, String repeatabilityRequestId,
            String repeatabilityFirstSent, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/special-headers/repeatability/immediateSuccess");
            if (repeatabilityRequestId != null) {
                httpRequest.getHeaders()
                    .set(HttpHeaderName.fromString("repeatability-request-id"), repeatabilityRequestId);
            }
            if (repeatabilityFirstSent != null) {
                httpRequest.getHeaders()
                    .set(HttpHeaderName.fromString("repeatability-first-sent"), repeatabilityFirstSent);
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, RepeatabilityClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> immediateSuccessWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.Repeatability.immediateSuccess",
            requestContext, updatedContext -> {
                return service.immediateSuccess(this.getEndpoint(), UUID.randomUUID().toString(),
                    DateTimeRfc1123.toRfc1123String(OffsetDateTime.now()), updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(RepeatabilityClientImpl.class);
}
