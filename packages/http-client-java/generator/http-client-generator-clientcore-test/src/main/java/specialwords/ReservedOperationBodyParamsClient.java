package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import java.util.List;
import specialwords.implementation.ReservedOperationBodyParamsImpl;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ReservedOperationBodyParamsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ReservedOperationBodyParamsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ReservedOperationBodyParamsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ReservedOperationBodyParamsClient(ReservedOperationBodyParamsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The withItems operation.
     * 
     * @param items The items parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withItemsWithResponse(List<String> items, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ReservedOperationBodyParams.withItems",
            requestContext, updatedContext -> this.serviceClient.withItemsWithResponse(items, updatedContext));
    }

    /**
     * The withItems operation.
     * 
     * @param items The items parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withItems(List<String> items) {
        withItemsWithResponse(items, RequestContext.none());
    }
}
