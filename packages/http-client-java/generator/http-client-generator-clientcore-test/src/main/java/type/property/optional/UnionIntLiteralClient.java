package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.property.optional.implementation.UnionIntLiteralsImpl;

/**
 * Initializes a new instance of the synchronous OptionalClient type.
 */
@ServiceClient(builder = OptionalClientBuilder.class)
public final class UnionIntLiteralClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UnionIntLiteralsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UnionIntLiteralClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    UnionIntLiteralClient(UnionIntLiteralsImpl serviceClient, Instrumentation instrumentation) {
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
    public Response<UnionIntLiteralProperty> getAllWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.UnionIntLiteral.getAll",
            requestContext, updatedContext -> this.serviceClient.getAllWithResponse(updatedContext));
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
    public UnionIntLiteralProperty getAll() {
        return getAllWithResponse(RequestContext.none()).getValue();
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
    public Response<UnionIntLiteralProperty> getDefaultWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.UnionIntLiteral.getDefault",
            requestContext, updatedContext -> this.serviceClient.getDefaultWithResponse(updatedContext));
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
    public UnionIntLiteralProperty getDefault() {
        return getDefaultWithResponse(RequestContext.none()).getValue();
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
    public Response<Void> putAllWithResponse(UnionIntLiteralProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.UnionIntLiteral.putAll",
            requestContext, updatedContext -> this.serviceClient.putAllWithResponse(body, updatedContext));
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
    public void putAll(UnionIntLiteralProperty body) {
        putAllWithResponse(body, RequestContext.none());
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
    public Response<Void> putDefaultWithResponse(UnionIntLiteralProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.UnionIntLiteral.putDefault",
            requestContext, updatedContext -> this.serviceClient.putDefaultWithResponse(body, updatedContext));
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
    public void putDefault(UnionIntLiteralProperty body) {
        putDefaultWithResponse(body, RequestContext.none());
    }
}
