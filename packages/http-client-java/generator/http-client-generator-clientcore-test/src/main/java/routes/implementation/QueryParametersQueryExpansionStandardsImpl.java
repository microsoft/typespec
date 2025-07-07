package routes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in QueryParametersQueryExpansionStandards.
 */
public final class QueryParametersQueryExpansionStandardsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueryParametersQueryExpansionStandardsService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * Initializes an instance of QueryParametersQueryExpansionStandardsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueryParametersQueryExpansionStandardsImpl(RoutesClientImpl client) {
        this.service = QueryParametersQueryExpansionStandardsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientQueryParametersQueryExpansionStandards to be used by the
     * proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RoutesClientQueryParametersQueryExpansionStandards", host = "{endpoint}")
    public interface QueryParametersQueryExpansionStandardsService {
        static QueryParametersQueryExpansionStandardsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("routes.implementation.QueryParametersQueryExpansionStandardsServiceImpl");
                return (QueryParametersQueryExpansionStandardsService) clazz
                    .getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/primitive",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> primitive(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> array(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/record",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> record(@HostParam("endpoint") String endpoint, @QueryParam("param") Map<String, Integer> param,
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
