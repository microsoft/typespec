package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import routes.implementation.QueryParametersImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class QueryParametersClient {
    @Metadata(generated = true)
    private final QueryParametersImpl serviceClient;

    /**
     * Initializes an instance of QueryParametersClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    QueryParametersClient(QueryParametersImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The templateOnly operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> templateOnlyWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.templateOnlyWithResponse(param, requestOptions);
    }

    /**
     * The explicit operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> explicitWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.explicitWithResponse(param, requestOptions);
    }

    /**
     * The annotationOnly operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> annotationOnlyWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.annotationOnlyWithResponse(param, requestOptions);
    }

    /**
     * The templateOnly operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void templateOnly(String param) {
        // Generated convenience method for templateOnlyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        templateOnlyWithResponse(param, requestOptions).getValue();
    }

    /**
     * The explicit operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void explicit(String param) {
        // Generated convenience method for explicitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        explicitWithResponse(param, requestOptions).getValue();
    }

    /**
     * The annotationOnly operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void annotationOnly(String param) {
        // Generated convenience method for annotationOnlyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        annotationOnlyWithResponse(param, requestOptions).getValue();
    }
}
