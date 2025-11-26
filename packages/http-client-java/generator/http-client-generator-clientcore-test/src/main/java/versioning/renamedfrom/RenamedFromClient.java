package versioning.renamedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import versioning.renamedfrom.implementation.RenamedFromClientImpl;

/**
 * Initializes a new instance of the synchronous RenamedFromClient type.
 */
@ServiceClient(builder = RenamedFromClientBuilder.class)
public final class RenamedFromClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RenamedFromClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RenamedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    RenamedFromClient(RenamedFromClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The newOp operation.
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewModel> newOpWithResponse(String newQuery, NewModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.RenamedFrom.newOp", requestContext,
            updatedContext -> this.serviceClient.newOpWithResponse(newQuery, body, updatedContext));
    }

    /**
     * The newOp operation.
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public NewModel newOp(String newQuery, NewModel body) {
        return newOpWithResponse(newQuery, body, RequestContext.none()).getValue();
    }
}
