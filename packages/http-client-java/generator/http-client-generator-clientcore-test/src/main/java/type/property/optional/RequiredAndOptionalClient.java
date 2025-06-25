package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import type.property.optional.implementation.RequiredAndOptionalsImpl;

/**
 * Initializes a new instance of the synchronous OptionalClient type.
 */
@ServiceClient(builder = OptionalClientBuilder.class)
public final class RequiredAndOptionalClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RequiredAndOptionalsImpl serviceClient;

    /**
     * Initializes an instance of RequiredAndOptionalClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    RequiredAndOptionalClient(RequiredAndOptionalsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<RequiredAndOptionalProperty> getAllWithResponse(RequestContext requestContext) {
        return this.serviceClient.getAllWithResponse(requestContext);
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
    public RequiredAndOptionalProperty getAll() {
        return getAllWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get models that will return only the required properties.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return only the required properties.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<RequiredAndOptionalProperty> getRequiredOnlyWithResponse(RequestContext requestContext) {
        return this.serviceClient.getRequiredOnlyWithResponse(requestContext);
    }

    /**
     * Get models that will return only the required properties.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return only the required properties.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public RequiredAndOptionalProperty getRequiredOnly() {
        return getRequiredOnlyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Put a body with all properties present.
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
    public Response<Void> putAllWithResponse(RequiredAndOptionalProperty body, RequestContext requestContext) {
        return this.serviceClient.putAllWithResponse(body, requestContext);
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
    public void putAll(RequiredAndOptionalProperty body) {
        putAllWithResponse(body, RequestContext.none());
    }

    /**
     * Put a body with only required properties.
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
    public Response<Void> putRequiredOnlyWithResponse(RequiredAndOptionalProperty body, RequestContext requestContext) {
        return this.serviceClient.putRequiredOnlyWithResponse(body, requestContext);
    }

    /**
     * Put a body with only required properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putRequiredOnly(RequiredAndOptionalProperty body) {
        putRequiredOnlyWithResponse(body, RequestContext.none());
    }
}
