package type.model.visibility.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
import type.model.visibility.ReadOnlyModel;
import type.model.visibility.VisibilityModel;

/**
 * Initializes a new instance of the VisibilityClient type.
 */
public final class VisibilityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final VisibilityClientService service;

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
     * Initializes an instance of VisibilityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public VisibilityClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = VisibilityClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for VisibilityClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "VisibilityClient", host = "{endpoint}")
    public interface VisibilityClientService {
        static VisibilityClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.model.visibility.implementation.VisibilityClientServiceImpl");
                return (VisibilityClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/type/model/visibility", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<VisibilityModel> getModel(@HostParam("endpoint") String endpoint,
            @QueryParam("queryProp") int queryProp, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") VisibilityModel input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/type/model/visibility",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> headModel(@HostParam("endpoint") String endpoint, @QueryParam("queryProp") int queryProp,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") VisibilityModel input,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.PUT, path = "/type/model/visibility", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putModel(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") VisibilityModel input, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") VisibilityModel input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") VisibilityModel input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.DELETE,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> deleteModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") VisibilityModel input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/visibility/readonlyroundtrip",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ReadOnlyModel> putReadOnlyModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ReadOnlyModel input, RequestContext requestContext);
    }

    /**
     * The getModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return output model with visibility properties.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<VisibilityModel> getModelWithResponse(int queryProp, VisibilityModel input,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.getModel(this.getEndpoint(), queryProp, contentType, accept, input, requestContext);
    }

    /**
     * The headModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headModelWithResponse(int queryProp, VisibilityModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.headModel(this.getEndpoint(), queryProp, contentType, input, requestContext);
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.putModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The patchModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.patchModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The postModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.postModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The deleteModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.deleteModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The putReadOnlyModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return roundTrip model with readonly optional properties.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ReadOnlyModel> putReadOnlyModelWithResponse(ReadOnlyModel input, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.putReadOnlyModel(this.getEndpoint(), contentType, accept, input, requestContext);
    }
}
