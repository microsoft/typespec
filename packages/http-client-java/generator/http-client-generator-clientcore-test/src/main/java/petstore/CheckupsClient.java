package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import petstore.implementation.CheckupsImpl;

/**
 * Initializes a new instance of the synchronous PetStoreClient type.
 */
@ServiceClient(builder = PetStoreClientBuilder.class)
public final class CheckupsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final CheckupsImpl serviceClient;

    /**
     * Initializes an instance of CheckupsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    CheckupsClient(CheckupsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Creates or update an instance of the resource.
     * 
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Checkup> createOrUpdateWithResponse(int checkupId, CheckupUpdate resource,
        RequestContext requestContext) {
        return this.serviceClient.createOrUpdateWithResponse(checkupId, resource, requestContext);
    }

    /**
     * Creates or update an instance of the resource.
     * 
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Checkup createOrUpdate(int checkupId, CheckupUpdate resource) {
        return this.serviceClient.createOrUpdate(checkupId, resource);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Checkup items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CheckupCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        return this.serviceClient.listWithResponse(requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Checkup items.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public CheckupCollectionWithNextLink list() {
        return this.serviceClient.list();
    }
}
