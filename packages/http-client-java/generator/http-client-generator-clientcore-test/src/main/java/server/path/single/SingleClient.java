package server.path.single;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import server.path.single.implementation.SingleClientImpl;

/**
 * Initializes a new instance of the synchronous SingleClient type.
 */
@ServiceClient(builder = SingleClientBuilder.class)
public final class SingleClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SingleClientImpl serviceClient;

    /**
     * Initializes an instance of SingleClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    SingleClient(SingleClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The myOp operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> myOpWithResponse(RequestContext requestContext) {
        return this.serviceClient.myOpWithResponse(requestContext);
    }

    /**
     * The myOp operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void myOp() {
        myOpWithResponse(RequestContext.none());
    }
}
