package server.versions.notversioned.implementation;

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
        this.service = NotVersionedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for NotVersionedClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "NotVersionedClient", host = "{endpoint}")
    public interface NotVersionedClientService {
        static NotVersionedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("server.versions.notversioned.implementation.NotVersionedClientServiceImpl");
                return (NotVersionedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/without-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withoutApiVersion(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/with-query-api-version",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withQueryApiVersion(@HostParam("endpoint") String endpoint,
            @QueryParam("api-version") String apiVersion, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/server/versions/not-versioned/with-path-api-version/{apiVersion}",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withPathApiVersion(@HostParam("endpoint") String endpoint,
            @PathParam("apiVersion") String apiVersion, RequestContext requestContext);
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
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return service.withQueryApiVersion(this.getEndpoint(), apiVersion, requestContext);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryApiVersion(String apiVersion) {
        withQueryApiVersionWithResponse(apiVersion, RequestContext.none());
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return service.withPathApiVersion(this.getEndpoint(), apiVersion, requestContext);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPathApiVersion(String apiVersion) {
        withPathApiVersionWithResponse(apiVersion, RequestContext.none());
    }
}
