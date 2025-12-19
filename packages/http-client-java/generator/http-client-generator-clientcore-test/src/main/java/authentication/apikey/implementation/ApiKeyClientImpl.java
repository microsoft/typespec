package authentication.apikey.implementation;

import authentication.apikey.InvalidAuth;
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
 * Initializes a new instance of the ApiKeyClient type.
 */
public final class ApiKeyClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ApiKeyClientService service;

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
     * Initializes an instance of ApiKeyClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ApiKeyClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = ApiKeyClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for ApiKeyClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "ApiKeyClient", host = "{endpoint}")
    public interface ApiKeyClientService {
        static ApiKeyClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("authentication.apikey.implementation.ApiKeyClientServiceImpl");
                return (ApiKeyClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/api-key/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> valid(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/api-key/invalid",
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
        return this.instrumentation.instrumentWithResponse("Authentication.ApiKey.valid", requestContext,
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
        return this.instrumentation.instrumentWithResponse("Authentication.ApiKey.invalid", requestContext,
            updatedContext -> {
                return service.invalid(this.getEndpoint(), updatedContext);
            });
    }
}
