package type.union.discriminated.extendsnamespace;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.union.discriminated.extendsnamespace.customdiscriminator.PetBase2;
import type.union.discriminated.extendsnamespace.implementation.CustomDiscriminatorOperationsImpl;

/**
 * Initializes a new instance of the synchronous ExtendsClient type.
 */
@ServiceClient(builder = ExtendsClientBuilder.class)
public final class CustomDiscriminatorOperationsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final CustomDiscriminatorOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of CustomDiscriminatorOperationsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    CustomDiscriminatorOperationsClient(CustomDiscriminatorOperationsImpl serviceClient,
        Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getCat operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetBase2> getCatWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.getCat",
            requestContext, updatedContext -> this.serviceClient.getCatWithResponse(updatedContext));
    }

    /**
     * The getCat operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PetBase2 getCat() {
        return getCatWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putCat operation.
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
    public Response<Void> putCatWithResponse(PetBase2 input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.putCat",
            requestContext, updatedContext -> this.serviceClient.putCatWithResponse(input, updatedContext));
    }

    /**
     * The putCat operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putCat(PetBase2 input) {
        putCatWithResponse(input, RequestContext.none());
    }

    /**
     * The getDog operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetBase2> getDogWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.getDog",
            requestContext, updatedContext -> this.serviceClient.getDogWithResponse(updatedContext));
    }

    /**
     * The getDog operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PetBase2 getDog() {
        return getDogWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putDog operation.
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
    public Response<Void> putDogWithResponse(PetBase2 input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.putDog",
            requestContext, updatedContext -> this.serviceClient.putDogWithResponse(input, updatedContext));
    }

    /**
     * The putDog operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putDog(PetBase2 input) {
        putDogWithResponse(input, RequestContext.none());
    }
}
