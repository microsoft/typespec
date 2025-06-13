package parameters.basic;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import parameters.basic.implementation.ImplicitBodiesImpl;

/**
 * Initializes a new instance of the synchronous BasicClient type.
 */
@ServiceClient(builder = BasicClientBuilder.class)
public final class ImplicitBodyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ImplicitBodiesImpl serviceClient;

    /**
     * Initializes an instance of ImplicitBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ImplicitBodyClient(ImplicitBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The simple operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> simpleWithResponse(String name, RequestContext requestContext) {
        return this.serviceClient.simpleWithResponse(name, requestContext);
    }

    /**
     * The simple operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void simple(String name) {
        simpleWithResponse(name, RequestContext.none());
    }
}
