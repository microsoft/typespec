package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.property.additionalproperties.implementation.ExtendsUnknownsImpl;

/**
 * Initializes a new instance of the synchronous AdditionalPropertiesClient type.
 */
@ServiceClient(builder = AdditionalPropertiesClientBuilder.class)
public final class ExtendsUnknownClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ExtendsUnknownsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtendsUnknownClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ExtendsUnknownClient(ExtendsUnknownsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Get call.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ExtendsUnknownAdditionalProperties> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.AdditionalProperties.ExtendsUnknown.get",
            requestContext, updatedContext -> this.serviceClient.getWithResponse(updatedContext));
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
    public ExtendsUnknownAdditionalProperties get() {
        return getWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(ExtendsUnknownAdditionalProperties body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.AdditionalProperties.ExtendsUnknown.put",
            requestContext, updatedContext -> this.serviceClient.putWithResponse(body, updatedContext));
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
    public void put(ExtendsUnknownAdditionalProperties body) {
        putWithResponse(body, RequestContext.none());
    }
}
