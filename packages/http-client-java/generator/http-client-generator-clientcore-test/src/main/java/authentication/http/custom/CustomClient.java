package authentication.http.custom;

import authentication.http.custom.implementation.CustomClientImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * Initializes a new instance of the synchronous CustomClient type.
 */
@ServiceClient(builder = CustomClientBuilder.class)
public final class CustomClient {
    @Metadata(generated = true)
    private final CustomClientImpl serviceClient;

    /**
     * Initializes an instance of CustomClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    CustomClient(CustomClientImpl serviceClient) {
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
