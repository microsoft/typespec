package parameters.query;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import parameters.query.implementation.SpecialCharsImpl;

/**
 * Initializes a new instance of the synchronous QueryClient type.
 */
@ServiceClient(builder = QueryClientBuilder.class)
public final class SpecialCharClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final SpecialCharsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of SpecialCharClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    SpecialCharClient(SpecialCharsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The dollarSign operation.
     * 
     * @param filter The filter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> dollarSignWithResponse(String filter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.SpecialChar.dollarSign", requestContext,
            updatedContext -> this.serviceClient.dollarSignWithResponse(filter, updatedContext));
    }

    /**
     * The dollarSign operation.
     * 
     * @param filter The filter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void dollarSign(String filter) {
        dollarSignWithResponse(filter, RequestContext.none());
    }
}
