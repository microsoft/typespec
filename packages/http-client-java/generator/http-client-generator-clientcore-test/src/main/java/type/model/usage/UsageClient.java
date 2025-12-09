package type.model.usage;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.model.usage.implementation.UsageClientImpl;

/**
 * Initializes a new instance of the synchronous UsageClient type.
 */
@ServiceClient(builder = UsageClientBuilder.class)
public final class UsageClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UsageClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UsageClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    UsageClient(UsageClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The input operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> inputWithResponse(InputRecord input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Usage.input", requestContext,
            updatedContext -> this.serviceClient.inputWithResponse(input, updatedContext));
    }

    /**
     * The input operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void input(InputRecord input) {
        inputWithResponse(input, RequestContext.none());
    }

    /**
     * The output operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used in operation return type along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<OutputRecord> outputWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Usage.output", requestContext,
            updatedContext -> this.serviceClient.outputWithResponse(updatedContext));
    }

    /**
     * The output operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used in operation return type.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public OutputRecord output() {
        return outputWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The inputAndOutput operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used both as operation parameter and return type along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<InputOutputRecord> inputAndOutputWithResponse(InputOutputRecord body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Usage.inputAndOutput", requestContext,
            updatedContext -> this.serviceClient.inputAndOutputWithResponse(body, updatedContext));
    }

    /**
     * The inputAndOutput operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used both as operation parameter and return type.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public InputOutputRecord inputAndOutput(InputOutputRecord body) {
        return inputAndOutputWithResponse(body, RequestContext.none()).getValue();
    }
}
