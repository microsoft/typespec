package parameters.path;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import parameters.path.implementation.PathClientImpl;

/**
 * Initializes a new instance of the synchronous PathClient type.
 */
@ServiceClient(builder = PathClientBuilder.class)
public final class PathClient {
    @Metadata(generated = true)
    private final PathClientImpl serviceClient;

    /**
     * Initializes an instance of PathClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PathClient(PathClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The normal operation.
     * 
     * @param name The name parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> normalWithResponse(String name, RequestOptions requestOptions) {
        return this.serviceClient.normalWithResponse(name, requestOptions);
    }

    /**
     * The optional operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> optionalWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.optionalWithResponse(requestOptions);
    }

    /**
     * The normal operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void normal(String name) {
        // Generated convenience method for normalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        normalWithResponse(name, requestOptions).getValue();
    }

    /**
     * The optional operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void optional(String name) {
        // Generated convenience method for optionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        optionalWithResponse(requestOptions).getValue();
    }

    /**
     * The optional operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void optional() {
        // Generated convenience method for optionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        optionalWithResponse(requestOptions).getValue();
    }
}
