package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.PetsImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class PetsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PetsImpl serviceClient;

    /**
     * Initializes an instance of PetsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PetsClient(PetsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Pet> getWithResponse(int petId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(petId, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet get(int petId) {
        return this.serviceClient.get(petId);
    }

    /**
     * Updates an existing instance of the resource.
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
    public Response<Pet> updateWithResponse(int petId, PetUpdate properties, RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(petId, properties, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet update(int petId, PetUpdate properties) {
        return this.serviceClient.update(petId, properties);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(int petId, RequestContext requestContext) {
        return this.serviceClient.deleteWithResponse(petId, requestContext);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void delete(int petId) {
        this.serviceClient.delete(petId);
    }

    /**
     * Creates a new instance of the resource.
     * 
     * @param resource The resource parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Pet> createWithResponse(PetCreate resource, RequestContext requestContext) {
        return this.serviceClient.createWithResponse(resource, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet create(PetCreate resource) {
        return this.serviceClient.create(resource);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Pet items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        return this.serviceClient.listWithResponse(requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Pet items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PetCollectionWithNextLink list() {
        return this.serviceClient.list();
    }
}
