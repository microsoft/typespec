package authentication.http.custom.implementation;

import authentication.http.custom.InvalidAuth;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;

/**
 * Initializes a new instance of the CustomClient type.
 */
public final class CustomClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CustomClientService service;

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
     * Initializes an instance of CustomClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public CustomClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = CustomClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for CustomClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "CustomClient", host = "{endpoint}")
    public interface CustomClientService {
        static CustomClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("authentication.http.custom.implementation.CustomClientServiceImpl");
                return (CustomClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/http/custom/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> valid(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/http/custom/invalid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(statusCode = { 403 }, exceptionBodyClass = InvalidAuth.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> invalid(@HostParam("endpoint") String endpoint, RequestContext requestContext);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.Http.Custom.valid", requestContext,
            updatedContext -> {
                return service.valid(this.getEndpoint(), updatedContext);
            });
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> invalidWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.Http.Custom.invalid", requestContext,
            updatedContext -> {
                return service.invalid(this.getEndpoint(), updatedContext);
            });
    }
}
