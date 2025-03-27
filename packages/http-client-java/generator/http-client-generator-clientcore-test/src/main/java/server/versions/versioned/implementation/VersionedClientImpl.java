package server.versions.versioned.implementation;

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
import server.versions.versioned.VersionedServiceVersion;

/**
 * Initializes a new instance of the VersionedClient type.
 */
public final class VersionedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final VersionedClientService service;

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
     * Service version.
     */
    private final VersionedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public VersionedServiceVersion getServiceVersion() {
        return this.serviceVersion;
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
     * Initializes an instance of VersionedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public VersionedClientImpl(HttpPipeline httpPipeline, String endpoint, VersionedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = RestProxy.create(VersionedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for VersionedClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "VersionedClient", host = "{endpoint}")
    public interface VersionedClientService {
        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/without-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withoutApiVersionSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-query-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryApiVersionSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-path-api-version/{apiVersion}",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPathApiVersionSync(@HostParam("endpoint") String endpoint,
            @PathParam("apiVersion") String apiVersion, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-query-old-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryOldApiVersionSync(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestOptions requestOptions);
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withQueryApiVersionWithResponse(RequestOptions requestOptions) {
        return service.withQueryApiVersionSync(this.getEndpoint(), this.getServiceVersion().getVersion(),
            requestOptions);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withPathApiVersionWithResponse(RequestOptions requestOptions) {
        return service.withPathApiVersionSync(this.getEndpoint(), this.getServiceVersion().getVersion(),
            requestOptions);
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> withQueryOldApiVersionWithResponse(RequestOptions requestOptions) {
        return service.withQueryOldApiVersionSync(this.getEndpoint(), this.getServiceVersion().getVersion(),
            requestOptions);
    }
}
