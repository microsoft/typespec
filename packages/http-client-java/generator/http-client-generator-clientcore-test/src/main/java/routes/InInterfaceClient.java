package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import routes.implementation.InInterfacesImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class InInterfaceClient {
    @Metadata(generated = true)
    private final InInterfacesImpl serviceClient;

    /**
     * Initializes an instance of InInterfaceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    InInterfaceClient(InInterfacesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The fixed operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> fixedWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.fixedWithResponse(requestOptions);
    }

    /**
     * The fixed operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void fixed() {
        // Generated convenience method for fixedWithResponse
        RequestOptions requestOptions = new RequestOptions();
        fixedWithResponse(requestOptions).getValue();
    }
}
