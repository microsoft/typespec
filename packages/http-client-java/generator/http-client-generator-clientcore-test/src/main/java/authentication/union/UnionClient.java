package authentication.union;

import authentication.union.implementation.UnionClientImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * Initializes a new instance of the synchronous UnionClient type.
 */
@ServiceClient(builder = UnionClientBuilder.class)
public final class UnionClient {
    @Metadata(generated = true)
    private final UnionClientImpl serviceClient;

    /**
     * Initializes an instance of UnionClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    UnionClient(UnionClientImpl serviceClient) {
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
    public Response<Void> validKeyWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.validKeyWithResponse(requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> validTokenWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.validTokenWithResponse(requestOptions);
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void validKey() {
        // Generated convenience method for validKeyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        validKeyWithResponse(requestOptions).getValue();
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void validToken() {
        // Generated convenience method for validTokenWithResponse
        RequestOptions requestOptions = new RequestOptions();
        validTokenWithResponse(requestOptions).getValue();
    }
}
