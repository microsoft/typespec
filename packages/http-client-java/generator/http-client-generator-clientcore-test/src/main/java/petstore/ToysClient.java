package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.ToysImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class ToysClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ToysImpl serviceClient;

    /**
     * Initializes an instance of ToysClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ToysClient(ToysImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Toy> getWithResponse(int petId, long toyId, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(petId, toyId, requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Toy get(int petId, long toyId) {
        return this.serviceClient.get(petId, toyId);
    }

    /**
     * The list operation.
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Toy items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ToyCollectionWithNextLink> listWithResponse(int petId, String nameFilter,
        RequestContext requestContext) {
        return this.serviceClient.listWithResponse(petId, nameFilter, requestContext);
    }

    /**
     * The list operation.
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Toy items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ToyCollectionWithNextLink list(int petId, String nameFilter) {
        return this.serviceClient.list(petId, nameFilter);
    }
}
