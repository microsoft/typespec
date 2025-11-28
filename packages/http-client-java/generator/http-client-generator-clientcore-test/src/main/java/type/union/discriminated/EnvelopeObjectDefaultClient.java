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
import type.union.discriminated.implementation.EnvelopeObjectDefaultsImpl;

/**
 * Initializes a new instance of the synchronous DiscriminatedClient type.
 */
@ServiceClient(builder = DiscriminatedClientBuilder.class)
public final class EnvelopeObjectDefaultClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final EnvelopeObjectDefaultsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of EnvelopeObjectDefaultClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    EnvelopeObjectDefaultClient(EnvelopeObjectDefaultsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The get operation.
     * 
     * @param kind The kind parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with default envelope serialization.
     * The discriminated union should serialize with "kind" as discriminator
     * and "value" as envelope property along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String kind, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Envelope.Object.Default.get",
            requestContext, updatedContext -> this.serviceClient.getWithResponse(kind, updatedContext));
    }

    /**
     * The get operation.
     * 
     * @param kind The kind parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with default envelope serialization.
     * The discriminated union should serialize with "kind" as discriminator
     * and "value" as envelope property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData get(String kind) {
        return getWithResponse(kind, RequestContext.none()).getValue();
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with default envelope serialization.
     * The discriminated union should serialize with "kind" as discriminator
     * and "value" as envelope property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData get() {
        final String kind = null;
        return getWithResponse(kind, RequestContext.none()).getValue();
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with default envelope serialization.
     * The discriminated union should serialize with "kind" as discriminator
     * and "value" as envelope property along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putWithResponse(BinaryData input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Envelope.Object.Default.put",
            requestContext, updatedContext -> this.serviceClient.putWithResponse(input, updatedContext));
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with default envelope serialization.
     * The discriminated union should serialize with "kind" as discriminator
     * and "value" as envelope property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData put(BinaryData input) {
        return putWithResponse(input, RequestContext.none()).getValue();
    }
}
