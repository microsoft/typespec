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
import io.clientcore.core.utils.CoreUtils;
import java.lang.reflect.ParameterizedType;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.IntStream;
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

        private static final ParameterizedType TYPE_1 = CoreUtils.createParameterizedType(ErrorInRange.class);

        private static final ParameterizedType TYPE_2 = CoreUtils.createParameterizedType(Standard4XXError.class);

        private static final Map<Integer, ParameterizedType> ERROR_TYPES_0;

        static {
            Map<Integer, ParameterizedType> errorTypes = new HashMap<>();
            IntStream.rangeClosed(494, 499).forEach(status -> errorTypes.put(status, TYPE_1));
            ERROR_TYPES_0 = Collections.unmodifiableMap(errorTypes);
        }
        private static final Map<Integer, ParameterizedType> ERROR_TYPES_1;

        static {
            Map<Integer, ParameterizedType> errorTypes = new HashMap<>();
            IntStream.rangeClosed(400, 403).forEach(status -> errorTypes.put(status, TYPE_2));
            errorTypes.put(404, CoreUtils.createParameterizedType(NotFoundError.class));
            IntStream.rangeClosed(405, 499).forEach(status -> errorTypes.put(status, TYPE_2));
            ERROR_TYPES_1 = Collections.unmodifiableMap(errorTypes);
        }

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
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    CoreUtils.createParameterizedType(DefaultError.class),
                    StatusCodeRangeClientServiceImpl.ERROR_TYPES_0, StatusCodeRangeClientServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
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
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    null, StatusCodeRangeClientServiceImpl.ERROR_TYPES_1, StatusCodeRangeClientServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
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
