package encode.duration.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import java.time.Duration;

/**
 * An instance of this class provides access to all the operations defined in Lossies.
 */
public final class LossiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final LossiesService service;

    /**
     * The service client containing this operation class.
     */
    private final DurationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of LossiesImpl.
     *
     * @param client the instance of the service client containing this operation class.
     */
    LossiesImpl(DurationClientImpl client) {
        this.service = LossiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DurationClientLossies to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DurationClientLossies", host = "{endpoint}")
    public interface LossiesService {
        static LossiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.duration.implementation.LossiesServiceImpl");
                return (LossiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/lossy/int32-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> intSeconds(@HostParam("endpoint") String endpoint, @QueryParam("input") long input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/lossy/int32-milliseconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> intMilliseconds(@HostParam("endpoint") String endpoint, @QueryParam("input") long input,
            RequestContext requestContext);
    }

    /**
     * The intSeconds operation.
     *
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> intSecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Lossy.intSeconds", requestContext,
            updatedContext -> {
                long inputConverted = input.getSeconds();
                return service.intSeconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The intMilliseconds operation.
     *
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> intMillisecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Lossy.intMilliseconds", requestContext,
            updatedContext -> {
                long inputConverted = input.toMillis();
                return service.intMilliseconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }
}
