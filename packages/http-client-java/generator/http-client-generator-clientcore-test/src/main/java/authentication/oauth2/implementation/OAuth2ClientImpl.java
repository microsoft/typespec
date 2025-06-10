package authentication.oauth2.implementation;

import authentication.oauth2.InvalidAuth;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;

/**
 * Initializes a new instance of the OAuth2Client type.
 */
public final class OAuth2ClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final OAuth2ClientService service;

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
     * Initializes an instance of OAuth2Client client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public OAuth2ClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = OAuth2ClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for OAuth2Client to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "OAuth2Client", host = "{endpoint}")
    public interface OAuth2ClientService {
        static OAuth2ClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("authentication.oauth2.implementation.OAuth2ClientServiceImpl");
                return (OAuth2ClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/oauth2/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> valid(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/oauth2/invalid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(statusCode = { 403 }, exceptionBodyClass = InvalidAuth.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> invalid(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validWithResponse(RequestContext requestContext) {
        return service.valid(this.getEndpoint(), requestContext);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void valid() {
        validWithResponse(RequestContext.none());
    }

    /**
     * Check whether client is authenticated. Will return an invalid bearer error.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> invalidWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.invalid(this.getEndpoint(), accept, requestContext);
    }

    /**
     * Check whether client is authenticated. Will return an invalid bearer error.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void invalid() {
        invalidWithResponse(RequestContext.none());
    }
}
