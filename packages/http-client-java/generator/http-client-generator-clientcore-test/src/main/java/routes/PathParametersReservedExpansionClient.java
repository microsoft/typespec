package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import routes.implementation.PathParametersReservedExpansionsImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class PathParametersReservedExpansionClient {
    @Metadata(generated = true)
    private final PathParametersReservedExpansionsImpl serviceClient;

    /**
     * Initializes an instance of PathParametersReservedExpansionClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PathParametersReservedExpansionClient(PathParametersReservedExpansionsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> templateWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.templateWithResponse(param, requestOptions);
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> annotationWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.annotationWithResponse(param, requestOptions);
    }

    /**
     * The template operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void template(String param) {
        // Generated convenience method for templateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        templateWithResponse(param, requestOptions).getValue();
    }

    /**
     * The annotation operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void annotation(String param) {
        // Generated convenience method for annotationWithResponse
        RequestOptions requestOptions = new RequestOptions();
        annotationWithResponse(param, requestOptions).getValue();
    }
}
