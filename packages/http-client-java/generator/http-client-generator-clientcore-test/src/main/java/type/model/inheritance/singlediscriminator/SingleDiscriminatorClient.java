package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.model.inheritance.singlediscriminator.implementation.SingleDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous SingleDiscriminatorClient type.
 */
@ServiceClient(builder = SingleDiscriminatorClientBuilder.class)
public final class SingleDiscriminatorClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SingleDiscriminatorClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of SingleDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    SingleDiscriminatorClient(SingleDiscriminatorClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.getModel",
            requestContext, updatedContext -> this.serviceClient.getModelWithResponse(updatedContext));
    }

    /**
     * The getModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Bird getModel() {
        return getModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putModelWithResponse(Bird input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.putModel",
            requestContext, updatedContext -> this.serviceClient.putModelWithResponse(input, updatedContext));
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putModel(Bird input) {
        putModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getRecursiveModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getRecursiveModel", requestContext,
            updatedContext -> this.serviceClient.getRecursiveModelWithResponse(updatedContext));
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Bird getRecursiveModel() {
        return getRecursiveModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putRecursiveModelWithResponse(Bird input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.putRecursiveModel", requestContext,
            updatedContext -> this.serviceClient.putRecursiveModelWithResponse(input, updatedContext));
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putRecursiveModel(Bird input) {
        putRecursiveModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getMissingDiscriminator", requestContext,
            updatedContext -> this.serviceClient.getMissingDiscriminatorWithResponse(updatedContext));
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Bird getMissingDiscriminator() {
        return getMissingDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getWrongDiscriminator", requestContext,
            updatedContext -> this.serviceClient.getWrongDiscriminatorWithResponse(updatedContext));
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Bird getWrongDiscriminator() {
        return getWrongDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getLegacyModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return define a base class in the legacy way along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dinosaur> getLegacyModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.getLegacyModel",
            requestContext, updatedContext -> this.serviceClient.getLegacyModelWithResponse(updatedContext));
    }

    /**
     * The getLegacyModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return define a base class in the legacy way.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Dinosaur getLegacyModel() {
        return getLegacyModelWithResponse(RequestContext.none()).getValue();
    }
}
