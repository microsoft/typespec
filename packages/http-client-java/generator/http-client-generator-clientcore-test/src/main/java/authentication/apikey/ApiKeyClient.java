package authentication.apikey;

import authentication.apikey.implementation.ApiKeyClientImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * Initializes a new instance of the synchronous ApiKeyClient type.
 */
@ServiceClient(builder = ApiKeyClientBuilder.class)
public final class ApiKeyClient {
    @Metadata(generated = true)
    private final ApiKeyClientImpl serviceClient;

    /**
     * Initializes an instance of ApiKeyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ApiKeyClient(ApiKeyClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> validWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.validWithResponse(requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> invalidWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.invalidWithResponse(requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void valid() {
        // Generated convenience method for validWithResponse
        RequestOptions requestOptions = new RequestOptions();
        validWithResponse(requestOptions).getValue();
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void invalid() {
        // Generated convenience method for invalidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        invalidWithResponse(requestOptions).getValue();
    }
}
