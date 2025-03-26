package routes.implementation;

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
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/reserved-expansion/template/{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> templateSync(@HostParam("endpoint") String endpoint,
            @PathParam(value = "param", encoded = true) String param, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/reserved-expansion/annotation/{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> annotationSync(@HostParam("endpoint") String endpoint,
            @PathParam(value = "param", encoded = true) String param, RequestOptions requestOptions);
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> templateWithResponse(String param, RequestOptions requestOptions) {
        return service.templateSync(this.client.getEndpoint(), param, requestOptions);
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> annotationWithResponse(String param, RequestOptions requestOptions) {
        return service.annotationSync(this.client.getEndpoint(), param, requestOptions);
    }
}
