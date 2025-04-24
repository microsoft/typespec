package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.RequestOptions;
import payload.pageable.implementation.ServerDrivenPaginationsImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class ServerDrivenPaginationClient {
    @Metadata(generated = true)
    private final ServerDrivenPaginationsImpl serviceClient;

    /**
     * Initializes an instance of ServerDrivenPaginationClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ServerDrivenPaginationClient(ServerDrivenPaginationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The link operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     next: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> link(RequestOptions requestOptions) {
        return this.serviceClient.link(requestOptions);
    }

    /**
     * The link operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> link() {
        // Generated convenience method for link
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.link(requestOptions);
    }
}
