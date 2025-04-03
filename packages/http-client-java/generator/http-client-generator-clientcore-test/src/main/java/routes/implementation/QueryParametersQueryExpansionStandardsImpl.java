package routes.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
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
        this.service = RestProxy.create(QueryParametersQueryExpansionStandardsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientQueryParametersQueryExpansionStandards to be used by the
     * proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RoutesClientQueryPar", host = "{endpoint}")
    public interface QueryParametersQueryExpansionStandardsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/primitive",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> primitiveSync(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> arraySync(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/query-expansion/standard/record",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> recordSync(@HostParam("endpoint") String endpoint,
            @QueryParam("param") Map<String, Integer> param, RequestOptions requestOptions);
    }

    /**
     * The primitive operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> primitiveWithResponse(String param, RequestOptions requestOptions) {
        return service.primitiveSync(this.client.getEndpoint(), param, requestOptions);
    }

    /**
     * The array operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> arrayWithResponse(List<String> param, RequestOptions requestOptions) {
        String paramConverted = param.stream()
            .map(paramItemValue -> Objects.toString(paramItemValue, ""))
            .collect(Collectors.joining(","));
        return service.arraySync(this.client.getEndpoint(), paramConverted, requestOptions);
    }

    /**
     * The record operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> recordWithResponse(Map<String, Integer> param, RequestOptions requestOptions) {
        return service.recordSync(this.client.getEndpoint(), param, requestOptions);
    }
}
