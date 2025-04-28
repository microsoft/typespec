package parameters.path.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the PathClient type.
 */
public final class PathClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PathClientService service;

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
     * Initializes an instance of PathClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public PathClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(PathClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for PathClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "PathClient", host = "{endpoint}")
    public interface PathClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/path/normal/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> normalSync(@HostParam("endpoint") String endpoint, @PathParam("name") String name,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/path/optional{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> optionalSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * The normal operation.
     * 
     * @param name The name parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> normalWithResponse(String name, RequestOptions requestOptions) {
        return service.normalSync(this.getEndpoint(), name, requestOptions);
    }

    /**
     * The optional operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> optionalWithResponse(RequestOptions requestOptions) {
        return service.optionalSync(this.getEndpoint(), requestOptions);
    }
}
