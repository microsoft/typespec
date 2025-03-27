package authentication.union.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the UnionClient type.
 */
public final class UnionClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final UnionClientService service;

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
     * Initializes an instance of UnionClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public UnionClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(UnionClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for UnionClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "UnionClient", host = "{endpoint}")
    public interface UnionClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/union/validkey",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> validKeySync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/authentication/union/validtoken",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> validTokenSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> validKeyWithResponse(RequestOptions requestOptions) {
        return service.validKeySync(this.getEndpoint(), requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> validTokenWithResponse(RequestOptions requestOptions) {
        return service.validTokenSync(this.getEndpoint(), requestOptions);
    }
}
