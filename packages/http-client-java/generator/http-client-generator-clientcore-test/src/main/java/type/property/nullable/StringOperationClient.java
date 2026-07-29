package type.property.nullable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.property.nullable.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous NullableClient type.
 */
@ServiceClient(builder = NullableClientBuilder.class)
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
     * Get models that will return all properties in the model.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<StringProperty> getNonNullWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.String.getNonNull", requestContext,
            updatedContext -> this.serviceClient.getNonNullWithResponse(updatedContext));
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public StringProperty getNonNull() {
        return getNonNullWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get models that will return the default object.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<StringProperty> getNullWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.String.getNull", requestContext,
            updatedContext -> this.serviceClient.getNullWithResponse(updatedContext));
    }

    /**
     * Get models that will return the default object.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public StringProperty getNull() {
        return getNullWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchNonNullWithResponse(StringProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.String.patchNonNull", requestContext,
            updatedContext -> this.serviceClient.patchNonNullWithResponse(body, updatedContext));
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void patchNonNull(StringProperty body) {
        patchNonNullWithResponse(body, RequestContext.none());
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchNullWithResponse(StringProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.String.patchNull", requestContext,
            updatedContext -> this.serviceClient.patchNullWithResponse(body, updatedContext));
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void patchNull(StringProperty body) {
        patchNullWithResponse(body, RequestContext.none());
    }
}
