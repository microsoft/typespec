package response.statuscoderange.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;

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

    public interface StatusCodeRangeClientService {
        static StatusCodeRangeClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new StatusCodeRangeClientServiceImpl(pipeline);
        }

        Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext);

        Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext);
    }

    private static final class StatusCodeRangeClientServiceImpl implements StatusCodeRangeClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(StatusCodeRangeClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private StatusCodeRangeClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/response/status-code-range/error-response-status-code-in-range");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                java.util.Map<Integer, java.lang.reflect.ParameterizedType> statusToExceptionTypeMap
                    = new java.util.HashMap<>();
                statusToExceptionTypeMap.put(494, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                statusToExceptionTypeMap.put(495, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                statusToExceptionTypeMap.put(496, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                statusToExceptionTypeMap.put(497, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                statusToExceptionTypeMap.put(498, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                statusToExceptionTypeMap.put(499, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.ErrorInRange.class));
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer,
                    io.clientcore.core.utils.CoreUtils
                        .createParameterizedType(response.statuscoderange.DefaultError.class),
                    statusToExceptionTypeMap, StatusCodeRangeClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/response/status-code-range/error-response-status-code-404");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                java.util.Map<Integer, java.lang.reflect.ParameterizedType> statusToExceptionTypeMap
                    = new java.util.HashMap<>();
                statusToExceptionTypeMap.put(400, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(401, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(402, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(403, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(405, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(406, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(407, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(408, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(409, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(410, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(411, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(412, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(413, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(414, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(415, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(416, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(417, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(418, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(419, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(420, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(421, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(422, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(423, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(424, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(425, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(426, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(427, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(428, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(429, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(430, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(431, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(432, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(433, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(434, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(435, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(436, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(437, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(438, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(439, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(440, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(441, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(442, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(443, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(444, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(445, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(446, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(447, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(448, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(449, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(450, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(451, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(452, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(453, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(454, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(455, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(456, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(457, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(458, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(459, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(460, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(461, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(462, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(463, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(464, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(465, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(466, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(467, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(468, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(469, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(470, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(471, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(472, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(473, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(474, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(475, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(476, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(477, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(478, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(479, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(480, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(481, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(482, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(483, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(484, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(485, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(486, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(487, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(488, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(489, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(490, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(491, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(492, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(493, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(494, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(495, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(496, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(497, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(498, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(499, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.Standard4XXError.class));
                statusToExceptionTypeMap.put(404, io.clientcore.core.utils.CoreUtils
                    .createParameterizedType(response.statuscoderange.NotFoundError.class));
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, statusToExceptionTypeMap,
                    StatusCodeRangeClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
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

    private static final ClientLogger LOGGER = new ClientLogger(StatusCodeRangeClientImpl.class);
}
