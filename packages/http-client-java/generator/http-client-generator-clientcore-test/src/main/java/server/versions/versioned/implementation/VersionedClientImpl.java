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
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
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
     * Initializes an instance of VersionedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public VersionedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        VersionedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withoutApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withoutApiVersion",
            requestContext, updatedContext -> {
                return service.withoutApiVersion(this.getEndpoint(), updatedContext);
            });
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withQueryApiVersion",
            requestContext, updatedContext -> {
                return service.withQueryApiVersion(this.getEndpoint(), this.getServiceVersion().getVersion(),
                    updatedContext);
            });
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withPathApiVersion",
            requestContext, updatedContext -> {
                return service.withPathApiVersion(this.getEndpoint(), this.getServiceVersion().getVersion(),
                    updatedContext);
            });
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryOldApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withQueryOldApiVersion",
            requestContext, updatedContext -> {
                return service.withQueryOldApiVersion(this.getEndpoint(), this.getServiceVersion().getVersion(),
                    updatedContext);
            });
    }
}
