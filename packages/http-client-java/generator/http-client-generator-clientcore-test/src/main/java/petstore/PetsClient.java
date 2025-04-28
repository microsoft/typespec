package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.implementation.PetsImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class PetsClient {
    @Metadata(generated = true)
    private final PetsImpl serviceClient;

    /**
     * Initializes an instance of PetsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PetsClient(PetsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets an instance of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Response<Pet> getWithResponse(int petId, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(petId, requestOptions);
    }

    /**
     * Updates an existing instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Optional)
     *     tag: String (Optional)
     *     age: Integer (Optional)
     *     ownerId: Long (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Pet> updateWithResponse(int petId, BinaryData properties, RequestOptions requestOptions) {
        return this.serviceClient.updateWithResponse(petId, properties, requestOptions);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> deleteWithResponse(int petId, RequestOptions requestOptions) {
        return this.serviceClient.deleteWithResponse(petId, requestOptions);
    }

    /**
     * Creates a new instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param resource The resource parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Pet> createWithResponse(BinaryData resource, RequestOptions requestOptions) {
        return this.serviceClient.createWithResponse(resource, requestOptions);
    }

    /**
     * Lists all instances of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *          (Required){
     *             id: int (Required)
     *             name: String (Required)
     *             tag: String (Optional)
     *             age: int (Required)
     *             ownerId: long (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Pet items.
     */
    @Metadata(generated = true)
    public Response<PetCollectionWithNextLink> listWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.listWithResponse(requestOptions);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Pet get(int petId) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(petId, requestOptions).getValue();
    }

    /**
     * Updates an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Pet update(int petId, PetUpdate properties) {
        // Generated convenience method for updateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return updateWithResponse(petId, BinaryData.fromObject(properties), requestOptions).getValue();
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void delete(int petId) {
        // Generated convenience method for deleteWithResponse
        RequestOptions requestOptions = new RequestOptions();
        deleteWithResponse(petId, requestOptions).getValue();
    }

    /**
     * Creates a new instance of the resource.
     * 
     * @param resource The resource parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Pet create(PetCreate resource) {
        // Generated convenience method for createWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createWithResponse(BinaryData.fromObject(resource), requestOptions).getValue();
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Pet items.
     */
    @Metadata(generated = true)
    public PetCollectionWithNextLink list() {
        // Generated convenience method for listWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return listWithResponse(requestOptions).getValue();
    }
}
