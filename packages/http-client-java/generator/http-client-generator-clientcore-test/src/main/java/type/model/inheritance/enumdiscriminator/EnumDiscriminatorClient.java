package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import type.model.inheritance.enumdiscriminator.implementation.EnumDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous EnumDiscriminatorClient type.
 */
@ServiceClient(builder = EnumDiscriminatorClientBuilder.class)
public final class EnumDiscriminatorClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final EnumDiscriminatorClientImpl serviceClient;

    /**
     * Initializes an instance of EnumDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    EnumDiscriminatorClient(EnumDiscriminatorClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Receive model with extensible enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test extensible enum type for discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWithResponse(RequestContext requestContext) {
        return this.serviceClient.getExtensibleModelWithResponse(requestContext);
    }

    /**
     * Receive model with extensible enum discriminator type.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test extensible enum type for discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Dog getExtensibleModel() {
        return getExtensibleModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Send model with extensible enum discriminator type.
     * 
     * @param input Dog to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putExtensibleModelWithResponse(Dog input, RequestContext requestContext) {
        return this.serviceClient.putExtensibleModelWithResponse(input, requestContext);
    }

    /**
     * Send model with extensible enum discriminator type.
     * 
     * @param input Dog to create.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putExtensibleModel(Dog input) {
        putExtensibleModelWithResponse(input, RequestContext.none());
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.serviceClient.getExtensibleModelMissingDiscriminatorWithResponse(requestContext);
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Dog getExtensibleModelMissingDiscriminator() {
        return getExtensibleModelMissingDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.serviceClient.getExtensibleModelWrongDiscriminatorWithResponse(requestContext);
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Dog getExtensibleModelWrongDiscriminator() {
        return getExtensibleModelWrongDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Receive model with fixed enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test fixed enum type for discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWithResponse(RequestContext requestContext) {
        return this.serviceClient.getFixedModelWithResponse(requestContext);
    }

    /**
     * Receive model with fixed enum discriminator type.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test fixed enum type for discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Snake getFixedModel() {
        return getFixedModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Send model with fixed enum discriminator type.
     * 
     * @param input Snake to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putFixedModelWithResponse(Snake input, RequestContext requestContext) {
        return this.serviceClient.putFixedModelWithResponse(input, requestContext);
    }

    /**
     * Send model with fixed enum discriminator type.
     * 
     * @param input Snake to create.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putFixedModel(Snake input) {
        putFixedModelWithResponse(input, RequestContext.none());
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.serviceClient.getFixedModelMissingDiscriminatorWithResponse(requestContext);
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Snake getFixedModelMissingDiscriminator() {
        return getFixedModelMissingDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.serviceClient.getFixedModelWrongDiscriminatorWithResponse(requestContext);
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Snake getFixedModelWrongDiscriminator() {
        return getFixedModelWrongDiscriminatorWithResponse(RequestContext.none()).getValue();
    }
}
