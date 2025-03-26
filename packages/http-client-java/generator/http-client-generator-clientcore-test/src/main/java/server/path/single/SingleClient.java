package server.path.single;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import server.path.single.implementation.SingleClientImpl;

/**
 * Initializes a new instance of the synchronous SingleClient type.
 */
@ServiceClient(builder = SingleClientBuilder.class)
public final class SingleClient {
    @Metadata(generated = true)
    private final SingleClientImpl serviceClient;

    /**
     * Initializes an instance of SingleClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    SingleClient(SingleClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The myOp operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> myOpWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.myOpWithResponse(requestOptions);
    }

    /**
     * The myOp operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void myOp() {
        // Generated convenience method for myOpWithResponse
        RequestOptions requestOptions = new RequestOptions();
        myOpWithResponse(requestOptions).getValue();
    }
}
