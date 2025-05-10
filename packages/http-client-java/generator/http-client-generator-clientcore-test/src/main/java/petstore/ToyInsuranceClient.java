package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.ToyInsurancesImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class ToyInsuranceClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ToyInsurancesImpl serviceClient;

    /**
     * Initializes an instance of ToyInsuranceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ToyInsuranceClient(ToyInsurancesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> getWithResponse(int petId, long toyId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(petId, toyId, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance get(int petId, long toyId) {
        return this.serviceClient.get(petId, toyId);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> updateWithResponse(int petId, long toyId, InsuranceUpdate properties,
        RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(petId, toyId, properties, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance update(int petId, long toyId, InsuranceUpdate properties) {
        return this.serviceClient.update(petId, toyId, properties);
    }
}
