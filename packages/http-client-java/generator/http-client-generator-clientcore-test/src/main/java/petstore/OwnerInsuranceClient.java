package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.implementation.OwnerInsurancesImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class OwnerInsuranceClient {
    @Metadata(generated = true)
    private final OwnerInsurancesImpl serviceClient;

    /**
     * Initializes an instance of OwnerInsuranceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    OwnerInsuranceClient(OwnerInsurancesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets the singleton resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     provider: String (Required)
     *     premium: int (Required)
     *     deductible: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param ownerId The ownerId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the singleton resource.
     */
    @Metadata(generated = true)
    public Response<Insurance> getWithResponse(long ownerId, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(ownerId, requestOptions);
    }

    /**
     * Updates the singleton resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     provider: String (Optional)
     *     premium: Integer (Optional)
     *     deductible: Integer (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     provider: String (Required)
     *     premium: int (Required)
     *     deductible: int (Required)
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
    public Response<Insurance> updateWithResponse(long ownerId, BinaryData properties, RequestOptions requestOptions) {
        return this.serviceClient.updateWithResponse(ownerId, properties, requestOptions);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(generated = true)
    public Insurance get(long ownerId) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(ownerId, requestOptions).getValue();
    }

    /**
     * Updates the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Insurance update(long ownerId, InsuranceUpdate properties) {
        // Generated convenience method for updateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return updateWithResponse(ownerId, BinaryData.fromObject(properties), requestOptions).getValue();
    }
}
