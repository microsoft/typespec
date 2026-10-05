package specialheaders.repeatability.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.utils.DateTimeRfc1123;
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
        static RepeatabilityClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new RepeatabilityClientServiceImpl(pipeline);
        }

        Response<Void> immediateSuccess(String endpoint, String repeatabilityRequestId, String repeatabilityFirstSent,
            RequestContext requestContext);
    }

    private static final class RepeatabilityClientServiceImpl implements RepeatabilityClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(RepeatabilityClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private RepeatabilityClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> immediateSuccess(String endpoint, String repeatabilityRequestId,
            String repeatabilityFirstSent, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/special-headers/repeatability/immediateSuccess");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (repeatabilityRequestId != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("repeatability-request-id"),
                        repeatabilityRequestId);
            }
            if (repeatabilityFirstSent != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("repeatability-first-sent"),
                        repeatabilityFirstSent);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, RepeatabilityClientServiceImpl.LOGGER);
            }
            try {
                return;
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
