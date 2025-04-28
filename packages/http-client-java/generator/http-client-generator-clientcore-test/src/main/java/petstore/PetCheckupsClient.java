package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.implementation.PetCheckupsImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class PetCheckupsClient {
    @Metadata(generated = true)
    private final PetCheckupsImpl serviceClient;

    /**
     * Initializes an instance of PetCheckupsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PetCheckupsClient(PetCheckupsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Creates or update an instance of the extension resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     vetName: String (Optional)
     *     notes: String (Optional)
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
     *     vetName: String (Required)
     *     notes: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Checkup> createOrUpdateWithResponse(int petId, int checkupId, BinaryData resource,
        RequestOptions requestOptions) {
        return this.serviceClient.createOrUpdateWithResponse(petId, checkupId, resource, requestOptions);
    }

    /**
     * Lists all instances of the extension resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *          (Required){
     *             id: int (Required)
     *             vetName: String (Required)
     *             notes: String (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Checkup items.
     */
    @Metadata(generated = true)
    public Response<CheckupCollectionWithNextLink> listWithResponse(int petId, RequestOptions requestOptions) {
        return this.serviceClient.listWithResponse(petId, requestOptions);
    }

    /**
     * Creates or update an instance of the extension resource.
     * 
     * @param petId The petId parameter.
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Checkup createOrUpdate(int petId, int checkupId, CheckupUpdate resource) {
        // Generated convenience method for createOrUpdateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createOrUpdateWithResponse(petId, checkupId, BinaryData.fromObject(resource), requestOptions).getValue();
    }

    /**
     * Lists all instances of the extension resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Checkup items.
     */
    @Metadata(generated = true)
    public CheckupCollectionWithNextLink list(int petId) {
        // Generated convenience method for listWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return listWithResponse(petId, requestOptions).getValue();
    }
}
