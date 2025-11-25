package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.model.inheritance.nesteddiscriminator.implementation.NestedDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous NestedDiscriminatorClient type.
 */
@ServiceClient(builder = NestedDiscriminatorClientBuilder.class)
public final class NestedDiscriminatorClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NestedDiscriminatorClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NestedDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    NestedDiscriminatorClient(NestedDiscriminatorClientImpl serviceClient, Instrumentation instrumentation) {
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
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NestedDiscriminator.getModel",
            requestContext, updatedContext -> this.serviceClient.getModelWithResponse(updatedContext));
    }

    /**
     * The getModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getModel() {
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
    public Response<Void> putModelWithResponse(Fish input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NestedDiscriminator.putModel",
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
    public void putModel(Fish input) {
        putModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getRecursiveModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.NestedDiscriminator.getRecursiveModel", requestContext,
            updatedContext -> this.serviceClient.getRecursiveModelWithResponse(updatedContext));
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getRecursiveModel() {
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
    public Response<Void> putRecursiveModelWithResponse(Fish input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.NestedDiscriminator.putRecursiveModel", requestContext,
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
    public void putRecursiveModel(Fish input) {
        putRecursiveModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.NestedDiscriminator.getMissingDiscriminator", requestContext,
            updatedContext -> this.serviceClient.getMissingDiscriminatorWithResponse(updatedContext));
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getMissingDiscriminator() {
        return getMissingDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.NestedDiscriminator.getWrongDiscriminator", requestContext,
            updatedContext -> this.serviceClient.getWrongDiscriminatorWithResponse(updatedContext));
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getWrongDiscriminator() {
        return getWrongDiscriminatorWithResponse(RequestContext.none()).getValue();
    }
}
