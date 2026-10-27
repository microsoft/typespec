package parameters.bodyroot;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import parameters.bodyroot.implementation.BodyRootClientImpl;

/**
 * Initializes a new instance of the synchronous BodyRootClient type.
 */
@ServiceClient(builder = BodyRootClientBuilder.class)
public final class BodyRootClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BodyRootClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BodyRootClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    BodyRootClient(BodyRootClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The nested operation.
     * 
     * @param bodyRootParameters The bodyRootParameters parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> nestedWithResponse(BodyRootModel bodyRootParameters, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyRoot.nested", requestContext,
            updatedContext -> this.serviceClient.nestedWithResponse(bodyRootParameters, updatedContext));
    }

    /**
     * The nested operation.
     * 
     * @param bodyRootParameters The bodyRootParameters parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void nested(BodyRootModel bodyRootParameters) {
        nestedWithResponse(bodyRootParameters, RequestContext.none());
    }
}
