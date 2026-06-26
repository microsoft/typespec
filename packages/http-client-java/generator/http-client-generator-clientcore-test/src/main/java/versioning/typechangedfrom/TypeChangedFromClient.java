package versioning.typechangedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import versioning.typechangedfrom.implementation.TypeChangedFromClientImpl;

/**
 * Initializes a new instance of the synchronous TypeChangedFromClient type.
 */
@ServiceClient(builder = TypeChangedFromClientBuilder.class)
public final class TypeChangedFromClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final TypeChangedFromClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TypeChangedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    TypeChangedFromClient(TypeChangedFromClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The test operation.
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(String param, TestModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.TypeChangedFrom.test", requestContext,
            updatedContext -> this.serviceClient.testWithResponse(param, body, updatedContext));
    }

    /**
     * The test operation.
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TestModel test(String param, TestModel body) {
        return testWithResponse(param, body, RequestContext.none()).getValue();
    }
}
