package versioning.returntypechangedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import versioning.returntypechangedfrom.implementation.ReturnTypeChangedFromClientImpl;

/**
 * Initializes a new instance of the synchronous ReturnTypeChangedFromClient type.
 */
@ServiceClient(builder = ReturnTypeChangedFromClientBuilder.class)
public final class ReturnTypeChangedFromClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ReturnTypeChangedFromClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ReturnTypeChangedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ReturnTypeChangedFromClient(ReturnTypeChangedFromClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> testWithResponse(String body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.ReturnTypeChangedFrom.test", requestContext,
            updatedContext -> this.serviceClient.testWithResponse(body, updatedContext));
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public String test(String body) {
        return testWithResponse(body, RequestContext.none()).getValue();
    }
}
