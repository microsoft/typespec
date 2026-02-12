package type.union.discriminated;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.models.binarydata.BinaryData;
import type.union.discriminated.implementation.NoEnvelopeCustomDiscriminatorsImpl;

/**
 * Initializes a new instance of the synchronous DiscriminatedClient type.
 */
@ServiceClient(builder = DiscriminatedClientBuilder.class)
public final class NoEnvelopeCustomDiscriminatorClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NoEnvelopeCustomDiscriminatorsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NoEnvelopeCustomDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    NoEnvelopeCustomDiscriminatorClient(NoEnvelopeCustomDiscriminatorsImpl serviceClient,
        Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The get operation.
     * 
     * @param type The type parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String type, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.get", requestContext,
            updatedContext -> this.serviceClient.getWithResponse(type, updatedContext));
    }

    /**
     * The get operation.
     * 
     * @param type The type parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData get(String type) {
        return getWithResponse(type, RequestContext.none()).getValue();
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData get() {
        final String type = null;
        return getWithResponse(type, RequestContext.none()).getValue();
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putWithResponse(BinaryData input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.put", requestContext,
            updatedContext -> this.serviceClient.putWithResponse(input, updatedContext));
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData put(BinaryData input) {
        return putWithResponse(input, RequestContext.none()).getValue();
    }
}
