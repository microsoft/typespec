package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.PetInsurancesImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class PetInsuranceClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PetInsurancesImpl serviceClient;

    /**
     * Initializes an instance of PetInsuranceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PetInsuranceClient(PetInsurancesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> getWithResponse(int petId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(petId, requestContext);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance get(int petId) {
        return this.serviceClient.get(petId);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> updateWithResponse(int petId, InsuranceUpdate properties,
        RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(petId, properties, requestContext);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance update(int petId, InsuranceUpdate properties) {
        return this.serviceClient.update(petId, properties);
    }
}
