package routes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in PathParametersReservedExpansions.
 */
public final class PathParametersReservedExpansionsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PathParametersReservedExpansionsService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * Initializes an instance of PathParametersReservedExpansionsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PathParametersReservedExpansionsImpl(RoutesClientImpl client) {
        this.service = RestProxy.create(PathParametersReservedExpansionsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientPathParametersReservedExpansions to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "RoutesClientPathPara", host = "{endpoint}")
    public interface PathParametersReservedExpansionsService {
        static PathParametersReservedExpansionsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("routes.implementation.PathParametersReservedExpansionsServiceImpl");
                return (PathParametersReservedExpansionsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/reserved-expansion/template/{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> template(@HostParam("endpoint") String endpoint,
            @PathParam(value = "param", encoded = true) String param, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/reserved-expansion/annotation/{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> annotation(@HostParam("endpoint") String endpoint,
            @PathParam(value = "param", encoded = true) String param, RequestContext requestContext);
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> templateWithResponse(String param, RequestContext requestContext) {
        return service.template(this.client.getEndpoint(), param, requestContext);
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void template(String param) {
        templateWithResponse(param, RequestContext.none());
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> annotationWithResponse(String param, RequestContext requestContext) {
        return service.annotation(this.client.getEndpoint(), param, requestContext);
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void annotation(String param) {
        annotationWithResponse(param, RequestContext.none());
    }
}
