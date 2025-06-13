package server.endpoint.notdefined;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import server.endpoint.notdefined.implementation.NotDefinedClientImpl;

/**
 * Initializes a new instance of the synchronous NotDefinedClient type.
 */
@ServiceClient(builder = NotDefinedClientBuilder.class)
public final class NotDefinedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NotDefinedClientImpl serviceClient;

    /**
     * Initializes an instance of NotDefinedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    NotDefinedClient(NotDefinedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The valid operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validWithResponse(RequestContext requestContext) {
        return this.serviceClient.validWithResponse(requestContext);
    }

    /**
     * The valid operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void valid() {
        validWithResponse(RequestContext.none());
    }
}
