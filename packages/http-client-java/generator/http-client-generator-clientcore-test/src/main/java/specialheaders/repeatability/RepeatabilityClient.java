package specialheaders.repeatability;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import specialheaders.repeatability.implementation.RepeatabilityClientImpl;

/**
 * Initializes a new instance of the synchronous RepeatabilityClient type.
 */
@ServiceClient(builder = RepeatabilityClientBuilder.class)
public final class RepeatabilityClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RepeatabilityClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RepeatabilityClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    RepeatabilityClient(RepeatabilityClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> immediateSuccessWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.Repeatability.immediateSuccess",
            requestContext, updatedContext -> this.serviceClient.immediateSuccessWithResponse(updatedContext));
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void immediateSuccess() {
        immediateSuccessWithResponse(RequestContext.none());
    }
}
