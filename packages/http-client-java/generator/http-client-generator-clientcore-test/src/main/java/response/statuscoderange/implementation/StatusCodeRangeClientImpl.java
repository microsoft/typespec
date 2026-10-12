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
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.lang.reflect.ParameterizedType;
import java.util.HashMap;
import java.util.Map;
import response.statuscoderange.DefaultError;
import response.statuscoderange.ErrorInRange;
import response.statuscoderange.NotFoundError;
import response.statuscoderange.Standard4XXError;

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
        static StatusCodeRangeClientService getNewInstance(HttpPipeline pipeline) {
            return new StatusCodeRangeClientServiceImpl(pipeline);
        }

        Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext);

        Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext);
    }

    private static final class StatusCodeRangeClientServiceImpl implements StatusCodeRangeClientService {
        private static final ClientLogger LOGGER = new ClientLogger(StatusCodeRangeClientServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private StatusCodeRangeClientServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> errorResponseStatusCodeInRange(String endpoint, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/response/status-code-range/error-response-status-code-in-range");
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
                Map<Integer, ParameterizedType> statusToExceptionTypeMap = new HashMap<>();
                statusToExceptionTypeMap.put(494, CoreUtils.createParameterizedType(ErrorInRange.class));
                statusToExceptionTypeMap.put(495, CoreUtils.createParameterizedType(ErrorInRange.class));
                statusToExceptionTypeMap.put(496, CoreUtils.createParameterizedType(ErrorInRange.class));
                statusToExceptionTypeMap.put(497, CoreUtils.createParameterizedType(ErrorInRange.class));
                statusToExceptionTypeMap.put(498, CoreUtils.createParameterizedType(ErrorInRange.class));
                statusToExceptionTypeMap.put(499, CoreUtils.createParameterizedType(ErrorInRange.class));
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, CoreUtils.createParameterizedType(DefaultError.class), statusToExceptionTypeMap,
                    StatusCodeRangeClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> errorResponseStatusCode404(String endpoint, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/response/status-code-range/error-response-status-code-404");
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
                Map<Integer, ParameterizedType> statusToExceptionTypeMap = new HashMap<>();
                statusToExceptionTypeMap.put(400, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(401, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(402, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(403, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(405, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(406, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(407, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(408, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(409, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(410, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(411, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(412, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(413, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(414, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(415, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(416, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(417, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(418, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(419, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(420, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(421, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(422, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(423, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(424, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(425, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(426, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(427, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(428, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(429, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(430, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(431, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(432, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(433, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(434, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(435, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(436, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(437, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(438, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(439, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(440, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(441, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(442, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(443, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(444, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(445, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(446, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(447, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(448, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(449, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(450, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(451, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(452, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(453, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(454, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(455, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(456, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(457, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(458, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(459, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(460, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(461, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(462, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(463, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(464, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(465, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(466, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(467, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(468, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(469, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(470, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(471, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(472, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(473, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(474, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(475, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(476, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(477, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(478, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(479, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(480, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(481, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(482, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(483, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(484, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(485, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(486, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(487, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(488, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(489, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(490, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(491, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(492, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(493, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(494, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(495, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(496, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(497, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(498, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(499, CoreUtils.createParameterizedType(Standard4XXError.class));
                statusToExceptionTypeMap.put(404, CoreUtils.createParameterizedType(NotFoundError.class));
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, statusToExceptionTypeMap, StatusCodeRangeClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
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
