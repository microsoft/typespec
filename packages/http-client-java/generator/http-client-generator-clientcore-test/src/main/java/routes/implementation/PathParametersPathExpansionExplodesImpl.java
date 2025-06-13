package routes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in PathParametersPathExpansionExplodes.
 */
public final class PathParametersPathExpansionExplodesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PathParametersPathExpansionExplodesService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * Initializes an instance of PathParametersPathExpansionExplodesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PathParametersPathExpansionExplodesImpl(RoutesClientImpl client) {
        this.service = PathParametersPathExpansionExplodesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientPathParametersPathExpansionExplodes to be used by the
     * proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RoutesClientPathParametersPathExpansionExplodes", host = "{endpoint}")
    public interface PathParametersPathExpansionExplodesService {
        static PathParametersPathExpansionExplodesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("routes.implementation.PathParametersPathExpansionExplodesServiceImpl");
                return (PathParametersPathExpansionExplodesService) clazz
                    .getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/path/explode/primitive{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> primitive(@HostParam("endpoint") String endpoint, @PathParam("param") String param,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/path/explode/array{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> array(@HostParam("endpoint") String endpoint, @PathParam("param") String param,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/path/path/explode/record{param}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> record(@HostParam("endpoint") String endpoint, @PathParam("param") Map<String, Integer> param,
            RequestContext requestContext);
    }

    /**
     * The primitive operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> primitiveWithResponse(String param, RequestContext requestContext) {
        return service.primitive(this.client.getEndpoint(), param, requestContext);
    }

    /**
     * The array operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> arrayWithResponse(List<String> param, RequestContext requestContext) {
        String paramConverted = param.stream()
            .map(paramItemValue -> Objects.toString(paramItemValue, ""))
            .collect(Collectors.joining(","));
        return service.array(this.client.getEndpoint(), paramConverted, requestContext);
    }

    /**
     * The record operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> recordWithResponse(Map<String, Integer> param, RequestContext requestContext) {
        return service.record(this.client.getEndpoint(), param, requestContext);
    }
}
