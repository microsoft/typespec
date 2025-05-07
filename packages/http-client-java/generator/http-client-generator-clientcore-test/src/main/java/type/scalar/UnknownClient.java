package type.scalar;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.scalar.implementation.UnknownsImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class UnknownClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UnknownsImpl serviceClient;

    /**
     * Initializes an instance of UnknownClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    UnknownClient(UnknownsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * get unknown value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return unknown value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(RequestContext requestContext) {
        return this.serviceClient.getWithResponse(requestContext);
    }

    /**
     * get unknown value.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return unknown value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData get() {
        return this.serviceClient.get();
    }

    /**
     * put unknown value.
     * 
     * @param body _.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(BinaryData body, RequestContext requestContext) {
        return this.serviceClient.putWithResponse(body, requestContext);
    }

    /**
     * put unknown value.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(BinaryData body) {
        this.serviceClient.put(body);
    }
}
