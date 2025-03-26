package authentication.http.custom.implementation;

import authentication.http.custom.InvalidAuth;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

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
     * Initializes an instance of CustomClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public CustomClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(CustomClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for CustomClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "CustomClient", host = "{endpoint}")
    public interface CustomClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/http/custom/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> validSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/http/custom/invalid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(statusCode = { 403 }, exceptionBodyClass = InvalidAuth.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> invalidSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> validWithResponse(RequestOptions requestOptions) {
        return service.validSync(this.getEndpoint(), requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> invalidWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.invalidSync(this.getEndpoint(), accept, requestOptions);
    }
}
