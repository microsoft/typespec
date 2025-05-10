package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.OwnerInsurancesImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class OwnerInsuranceClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OwnerInsurancesImpl serviceClient;

    /**
     * Initializes an instance of OwnerInsuranceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    OwnerInsuranceClient(OwnerInsurancesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> getWithResponse(long ownerId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(ownerId, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance get(long ownerId) {
        return this.serviceClient.get(ownerId);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> updateWithResponse(long ownerId, InsuranceUpdate properties,
        RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(ownerId, properties, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance update(long ownerId, InsuranceUpdate properties) {
        return this.serviceClient.update(ownerId, properties);
    }
}
