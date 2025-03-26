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

/**
 * An instance of this class provides access to all the operations defined in QueryParameters.
 */
public final class QueryParametersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueryParametersService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * Initializes an instance of QueryParametersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueryParametersImpl(RoutesClientImpl client) {
        this.service = RestProxy.create(QueryParametersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for RoutesClientQueryParameters to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "RoutesClientQueryPar", host = "{endpoint}")
    public interface QueryParametersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/template-only",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> templateOnlySync(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/routes/query/explicit", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> explicitSync(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/routes/query/annotation-only",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> annotationOnlySync(@HostParam("endpoint") String endpoint, @QueryParam("param") String param,
            RequestOptions requestOptions);
    }

    /**
     * The templateOnly operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> templateOnlyWithResponse(String param, RequestOptions requestOptions) {
        return service.templateOnlySync(this.client.getEndpoint(), param, requestOptions);
    }

    /**
     * The explicit operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> explicitWithResponse(String param, RequestOptions requestOptions) {
        return service.explicitSync(this.client.getEndpoint(), param, requestOptions);
    }

    /**
     * The annotationOnly operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> annotationOnlyWithResponse(String param, RequestOptions requestOptions) {
        return service.annotationOnlySync(this.client.getEndpoint(), param, requestOptions);
    }
}
