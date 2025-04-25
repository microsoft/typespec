package versioning.removed.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
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
import versioning.removed.ModelV2;
import versioning.removed.ModelV3;
import versioning.removed.RemovedServiceVersion;
import versioning.removed.Versions;

/**
 * Initializes a new instance of the RemovedClient type.
 */
public final class RemovedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RemovedClientService service;

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
     * Need to be set as 'v1', 'v2preview' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1', 'v2preview' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
    }

    /**
     * Service version.
     */
    private final RemovedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RemovedServiceVersion getServiceVersion() {
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
     * Initializes an instance of RemovedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1', 'v2preview' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public RemovedClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        RemovedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.service = RemovedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for RemovedClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RemovedClient", host = "{endpoint}/versioning/removed/api-version:{version}")
    public interface RemovedClientService {
        static RemovedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.removed.implementation.RemovedClientServiceImpl");
                return (RemovedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV2 body, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v3", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV3> modelV3(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV3 body, RequestContext requestContext);
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV2> v2WithResponse(ModelV2 body, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v2(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestContext);
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelV2 v2(ModelV2 body) {
        return v2WithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * This operation will pass different paths and different request bodies based on different versions.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV3> modelV3WithResponse(ModelV3 body, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.modelV3(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestContext);
    }

    /**
     * This operation will pass different paths and different request bodies based on different versions.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelV3 modelV3(ModelV3 body) {
        return modelV3WithResponse(body, RequestContext.none()).getValue();
    }
}
