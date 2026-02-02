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
import parameters.query.implementation.ConstantsImpl;

/**
 * Initializes a new instance of the synchronous QueryClient type.
 */
@ServiceClient(builder = QueryClientBuilder.class)
public final class QueryClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ConstantsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueryClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    QueryClient(ConstantsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * post constant query value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.Constant.post", requestContext,
            updatedContext -> this.serviceClient.postWithResponse(updatedContext));
    }

    /**
     * post constant query value.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void post() {
        postWithResponse(RequestContext.none());
    }
}
