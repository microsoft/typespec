package versioning.madeoptional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import versioning.madeoptional.implementation.MadeOptionalClientImpl;

/**
 * Initializes a new instance of the synchronous MadeOptionalClient type.
 */
@ServiceClient(builder = MadeOptionalClientBuilder.class)
public final class MadeOptionalClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final MadeOptionalClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of MadeOptionalClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    MadeOptionalClient(MadeOptionalClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(TestModel body, String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.MadeOptional.test", requestContext,
            updatedContext -> this.serviceClient.testWithResponse(body, param, updatedContext));
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TestModel test(TestModel body, String param) {
        return testWithResponse(body, param, RequestContext.none()).getValue();
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TestModel test(TestModel body) {
        final String param = null;
        return testWithResponse(body, param, RequestContext.none()).getValue();
    }
}
