package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.implementation.OwnersImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class OwnersClient {
    @Metadata(generated = true)
    private final OwnersImpl serviceClient;

    /**
     * Initializes an instance of OwnersClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    OwnersClient(OwnersImpl serviceClient) {
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
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param ownerId The ownerId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Response<Owner> getWithResponse(long ownerId, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(ownerId, requestOptions);
    }

    /**
     * Updates an existing instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Optional)
     *     age: Integer (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Owner> updateWithResponse(long ownerId, BinaryData properties, RequestOptions requestOptions) {
        return this.serviceClient.updateWithResponse(ownerId, properties, requestOptions);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> deleteWithResponse(long ownerId, RequestOptions requestOptions) {
        return this.serviceClient.deleteWithResponse(ownerId, requestOptions);
    }

    /**
     * Creates a new instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     name: String (Required)
     *     age: int (Required)
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
    public Response<Owner> createWithResponse(BinaryData resource, RequestOptions requestOptions) {
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
     *             id: long (Required)
     *             name: String (Required)
     *             age: int (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Owner items.
     */
    @Metadata(generated = true)
    public Response<OwnerCollectionWithNextLink> listWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.listWithResponse(requestOptions);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(generated = true)
    public Owner get(long ownerId) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(ownerId, requestOptions).getValue();
    }

    /**
     * Updates an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Owner update(long ownerId, OwnerUpdate properties) {
        // Generated convenience method for updateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return updateWithResponse(ownerId, BinaryData.fromObject(properties), requestOptions).getValue();
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void delete(long ownerId) {
        // Generated convenience method for deleteWithResponse
        RequestOptions requestOptions = new RequestOptions();
        deleteWithResponse(ownerId, requestOptions).getValue();
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
    public Owner create(OwnerCreate resource) {
        // Generated convenience method for createWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createWithResponse(BinaryData.fromObject(resource), requestOptions).getValue();
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Owner items.
     */
    @Metadata(generated = true)
    public OwnerCollectionWithNextLink list() {
        // Generated convenience method for listWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return listWithResponse(requestOptions).getValue();
    }
}
