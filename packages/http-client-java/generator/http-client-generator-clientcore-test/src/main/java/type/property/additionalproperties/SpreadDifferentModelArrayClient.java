package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import type.property.additionalproperties.implementation.SpreadDifferentModelArraysImpl;

/**
 * Initializes a new instance of the synchronous AdditionalPropertiesClient type.
 */
@ServiceClient(builder = AdditionalPropertiesClientBuilder.class)
public final class SpreadDifferentModelArrayClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SpreadDifferentModelArraysImpl serviceClient;

    /**
     * Initializes an instance of SpreadDifferentModelArrayClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    SpreadDifferentModelArrayClient(SpreadDifferentModelArraysImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Get call.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DifferentSpreadModelArrayRecord> getWithResponse(RequestContext requestContext) {
        return this.serviceClient.getWithResponse(requestContext);
    }

    /**
     * Get call.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public DifferentSpreadModelArrayRecord get() {
        return this.serviceClient.get();
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(DifferentSpreadModelArrayRecord body, RequestContext requestContext) {
        return this.serviceClient.putWithResponse(body, requestContext);
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(DifferentSpreadModelArrayRecord body) {
        this.serviceClient.put(body);
    }
}
