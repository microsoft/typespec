package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.OwnersImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class OwnersClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OwnersImpl serviceClient;

    /**
     * Initializes an instance of OwnersClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    OwnersClient(OwnersImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Owner> getWithResponse(long ownerId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(ownerId, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Owner get(long ownerId) {
        return this.serviceClient.get(ownerId);
    }

    /**
     * Updates an existing instance of the resource.
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
    public Response<Owner> updateWithResponse(long ownerId, OwnerUpdate properties, RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(ownerId, properties, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Owner update(long ownerId, OwnerUpdate properties) {
        return this.serviceClient.update(ownerId, properties);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(long ownerId, RequestContext requestContext) {
        return this.serviceClient.deleteWithResponse(ownerId, requestContext);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void delete(long ownerId) {
        this.serviceClient.delete(ownerId);
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
    public Response<Owner> createWithResponse(OwnerCreate resource, RequestContext requestContext) {
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
    public Owner create(OwnerCreate resource) {
        return this.serviceClient.create(resource);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Owner items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<OwnerCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        return this.serviceClient.listWithResponse(requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Owner items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public OwnerCollectionWithNextLink list() {
        return this.serviceClient.list();
    }
}
