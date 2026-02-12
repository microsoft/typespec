package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.property.valuetypes.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous ValueTypesClient type.
 */
@ServiceClient(builder = ValueTypesClientBuilder.class)
public final class StringOperationClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringOperationClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    StringOperationClient(StringOperationsImpl serviceClient, Instrumentation instrumentation) {
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
    public Response<StringProperty> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.ValueTypes.String.get", requestContext,
            updatedContext -> this.serviceClient.getWithResponse(updatedContext));
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
    public StringProperty get() {
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
    public Response<Void> putWithResponse(StringProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.ValueTypes.String.put", requestContext,
            updatedContext -> this.serviceClient.putWithResponse(body, updatedContext));
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
    public void put(StringProperty body) {
        putWithResponse(body, RequestContext.none());
    }
}
