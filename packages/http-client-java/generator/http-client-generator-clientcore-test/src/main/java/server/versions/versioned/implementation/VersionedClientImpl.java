package server.versions.versioned.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;

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
     * Version parameter.
     */
    private final String apiVersion;

    /**
     * Gets Version parameter.
     * 
     * @return the apiVersion value.
     */
    public String getApiVersion() {
        return this.apiVersion;
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
     * @param apiVersion Version parameter.
     */
    public VersionedClientImpl(HttpPipeline httpPipeline, String endpoint, String apiVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.apiVersion = apiVersion;
        this.service = VersionedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for VersionedClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "VersionedClient", host = "{endpoint}")
    public interface VersionedClientService {
        static VersionedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("server.versions.versioned.implementation.VersionedClientServiceImpl");
                return (VersionedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/without-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withoutApiVersion(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-query-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryApiVersion(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-path-api-version/{apiVersion}",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPathApiVersion(@HostParam("endpoint") String endpoint,
            @PathParam("apiVersion") String apiVersion, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/versioned/with-query-old-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryOldApiVersion(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestContext requestContext);
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withoutApiVersionWithResponse(RequestContext requestContext) {
        return service.withoutApiVersion(this.getEndpoint(), requestContext);
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withoutApiVersion() {
        withoutApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(RequestContext requestContext) {
        return service.withQueryApiVersion(this.getEndpoint(), this.getApiVersion(), requestContext);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryApiVersion() {
        withQueryApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(RequestContext requestContext) {
        return service.withPathApiVersion(this.getEndpoint(), this.getApiVersion(), requestContext);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPathApiVersion() {
        withPathApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryOldApiVersionWithResponse(RequestContext requestContext) {
        return service.withQueryOldApiVersion(this.getEndpoint(), this.getApiVersion(), requestContext);
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryOldApiVersion() {
        withQueryOldApiVersionWithResponse(RequestContext.none());
    }
}
