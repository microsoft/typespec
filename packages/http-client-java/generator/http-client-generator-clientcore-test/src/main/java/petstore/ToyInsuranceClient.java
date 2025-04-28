package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.implementation.ToyInsurancesImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class ToyInsuranceClient {
    @Metadata(generated = true)
    private final ToyInsurancesImpl serviceClient;

    /**
     * Initializes an instance of ToyInsuranceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ToyInsuranceClient(ToyInsurancesImpl serviceClient) {
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
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the singleton resource.
     */
    @Metadata(generated = true)
    public Response<Insurance> getWithResponse(int petId, long toyId, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(petId, toyId, requestOptions);
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
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param properties The properties parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Insurance> updateWithResponse(int petId, long toyId, BinaryData properties,
        RequestOptions requestOptions) {
        return this.serviceClient.updateWithResponse(petId, toyId, properties, requestOptions);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(generated = true)
    public Insurance get(int petId, long toyId) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(petId, toyId, requestOptions).getValue();
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Insurance update(int petId, long toyId, InsuranceUpdate properties) {
        // Generated convenience method for updateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return updateWithResponse(petId, toyId, BinaryData.fromObject(properties), requestOptions).getValue();
    }
}
