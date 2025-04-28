package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import petstore.implementation.ToysImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class ToysClient {
    @Metadata(generated = true)
    private final ToysImpl serviceClient;

    /**
     * Initializes an instance of ToysClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ToysClient(ToysImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets an instance of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     petId: long (Required)
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Response<Toy> getWithResponse(int petId, long toyId, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(petId, toyId, requestOptions);
    }

    /**
     * The list operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *          (Required){
     *             id: long (Required)
     *             petId: long (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Toy items.
     */
    @Metadata(generated = true)
    public Response<ToyCollectionWithNextLink> listWithResponse(int petId, String nameFilter,
        RequestOptions requestOptions) {
        return this.serviceClient.listWithResponse(petId, nameFilter, requestOptions);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Toy get(int petId, long toyId) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(petId, toyId, requestOptions).getValue();
    }

    /**
     * The list operation.
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Toy items.
     */
    @Metadata(generated = true)
    public ToyCollectionWithNextLink list(int petId, String nameFilter) {
        // Generated convenience method for listWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return listWithResponse(petId, nameFilter, requestOptions).getValue();
    }
}
