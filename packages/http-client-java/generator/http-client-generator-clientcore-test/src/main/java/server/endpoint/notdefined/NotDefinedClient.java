package server.endpoint.notdefined;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import server.endpoint.notdefined.implementation.NotDefinedClientImpl;

/**
 * Initializes a new instance of the synchronous NotDefinedClient type.
 */
@ServiceClient(builder = NotDefinedClientBuilder.class)
public final class NotDefinedClient {
    @Metadata(generated = true)
    private final NotDefinedClientImpl serviceClient;

    /**
     * Initializes an instance of NotDefinedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NotDefinedClient(NotDefinedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The valid operation.
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
     * The valid operation.
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
}
