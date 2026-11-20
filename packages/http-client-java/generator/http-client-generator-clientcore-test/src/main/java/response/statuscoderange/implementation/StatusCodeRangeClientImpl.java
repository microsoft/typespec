package response.statuscoderange.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
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
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.util.Map;

/**
 * Initializes a new instance of the StatusCodeRangeClient type.
 */
public final class StatusCodeRangeClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StatusCodeRangeClientService service;

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
     * Initializes an instance of StatusCodeRangeClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public StatusCodeRangeClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = StatusCodeRangeClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The HTTP operations for StatusCodeRangeClient.
     */
    public interface StatusCodeRangeClientService {
        static StatusCodeRangeClientService getNewInstance(HttpPipeline pipeline) {
            return new StatusCodeRangeClientServiceImpl(pipeline);
        }

        Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext);

        Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext);
    }

    private static final class StatusCodeRangeClientServiceImpl implements StatusCodeRangeClientService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(StatusCodeRangeClientService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private StatusCodeRangeClientServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/response/status-code-range/error-response-status-code-in-range");
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer,
                        CoreUtils.createParameterizedType(response.statuscoderange.DefaultError.class),
                        Map.ofEntries(
                            Map.entry(494,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class)),
                            Map.entry(495,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class)),
                            Map.entry(496,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class)),
                            Map.entry(497,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class)),
                            Map.entry(498,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class)),
                            Map.entry(499,
                                CoreUtils.createParameterizedType(response.statuscoderange.ErrorInRange.class))),
                        HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/response/status-code-range/error-response-status-code-404");
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null,
                        Map.ofEntries(
                            Map.entry(400,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(401,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(402,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(403,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(405,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(406,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(407,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(408,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(409,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(410,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(411,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(412,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(413,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(414,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(415,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(416,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(417,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(418,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(419,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(420,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(421,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(422,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(423,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(424,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(425,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(426,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(427,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(428,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(429,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(430,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(431,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(432,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(433,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(434,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(435,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(436,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(437,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(438,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(439,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(440,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(441,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(442,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(443,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(444,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(445,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(446,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(447,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(448,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(449,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(450,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(451,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(452,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(453,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(454,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(455,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(456,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(457,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(458,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(459,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(460,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(461,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(462,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(463,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(464,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(465,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(466,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(467,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(468,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(469,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(470,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(471,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(472,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(473,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(474,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(475,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(476,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(477,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(478,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(479,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(480,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(481,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(482,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(483,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(484,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(485,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(486,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(487,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(488,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(489,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(490,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(491,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(492,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(493,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(494,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(495,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(496,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(497,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(498,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(499,
                                CoreUtils.createParameterizedType(response.statuscoderange.Standard4XXError.class)),
                            Map.entry(404,
                                CoreUtils.createParameterizedType(response.statuscoderange.NotFoundError.class))),
                        HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> errorResponseStatusCodeInRangeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.StatusCodeRange.errorResponseStatusCodeInRange",
            requestContext, updatedContext -> {
                return service.errorResponseStatusCodeInRange(this.getEndpoint(), updatedContext);
            });
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> errorResponseStatusCode404WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.StatusCodeRange.errorResponseStatusCode404",
            requestContext, updatedContext -> {
                return service.errorResponseStatusCode404(this.getEndpoint(), updatedContext);
            });
    }
}
