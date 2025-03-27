package server.versions.notversioned.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the NotVersionedClient type.
 */
public final class NotVersionedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotVersionedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
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
     * Initializes an instance of NotVersionedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     */
    public NotVersionedClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(NotVersionedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for NotVersionedClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "NotVersionedClient", host = "{endpoint}")
    public interface NotVersionedClientService {
        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/without-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withoutApiVersionSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/with-query-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryApiVersionSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/with-path-api-version/{apiVersion}",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPathApiVersionSync(@HostParam("endpoint") String endpoint,
            @PathParam("apiVersion") String apiVersion, RequestOptions requestOptions);
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withoutApiVersionWithResponse(RequestOptions requestOptions) {
        return service.withoutApiVersionSync(this.getEndpoint(), requestOptions);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withQueryApiVersionWithResponse(String apiVersion, RequestOptions requestOptions) {
        return service.withQueryApiVersionSync(this.getEndpoint(), apiVersion, requestOptions);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withPathApiVersionWithResponse(String apiVersion, RequestOptions requestOptions) {
        return service.withPathApiVersionSync(this.getEndpoint(), apiVersion, requestOptions);
    }
}
