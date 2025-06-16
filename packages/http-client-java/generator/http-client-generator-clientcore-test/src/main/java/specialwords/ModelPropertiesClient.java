package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import specialwords.implementation.ModelPropertiesImpl;
import specialwords.modelproperties.SameAsModel;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ModelPropertiesClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ModelPropertiesImpl serviceClient;

    /**
     * Initializes an instance of ModelPropertiesClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ModelPropertiesClient(ModelPropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The sameAsModel operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sameAsModelWithResponse(SameAsModel body, RequestContext requestContext) {
        return this.serviceClient.sameAsModelWithResponse(body, requestContext);
    }

    /**
     * The sameAsModel operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void sameAsModel(SameAsModel body) {
        sameAsModelWithResponse(body, RequestContext.none());
    }
}
