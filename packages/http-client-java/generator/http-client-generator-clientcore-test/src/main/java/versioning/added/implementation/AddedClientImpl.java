package versioning.added.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
import versioning.added.AddedServiceVersion;
import versioning.added.ModelV1;
import versioning.added.ModelV2;

/**
 * Initializes a new instance of the AddedClient type.
 */
public final class AddedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final AddedClientService service;

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
    private final AddedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public AddedServiceVersion getServiceVersion() {
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
     * The InterfaceV2sImpl object to access its operations.
     */
    private final InterfaceV2sImpl interfaceV2s;

    /**
     * Gets the InterfaceV2sImpl object to access its operations.
     * 
     * @return the InterfaceV2sImpl object.
     */
    public InterfaceV2sImpl getInterfaceV2s() {
        return this.interfaceV2s;
    }

    /**
     * Initializes an instance of AddedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public AddedClientImpl(HttpPipeline httpPipeline, String endpoint, AddedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.interfaceV2s = new InterfaceV2sImpl(this);
        this.service = RestProxy.create(AddedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for AddedClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "AddedClient", host = "{endpoint}/versioning/added/api-version:{version}")
    public interface AddedClientService {
        static AddedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.added.implementation.AddedClientServiceImpl");
                return (AddedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v1", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV1> v1(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @HeaderParam("header-v2") String headerV2, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") ModelV1 body,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV2 body, RequestContext requestContext);
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV1> v1WithResponse(String headerV2, ModelV1 body, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v1(this.getEndpoint(), this.getServiceVersion().getVersion(), headerV2, contentType, accept,
            body, requestContext);
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelV1 v1(String headerV2, ModelV1 body) {
        return v1WithResponse(headerV2, body, RequestContext.none()).getValue();
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
        return service.v2(this.getEndpoint(), this.getServiceVersion().getVersion(), contentType, accept, body,
            requestContext);
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
}
