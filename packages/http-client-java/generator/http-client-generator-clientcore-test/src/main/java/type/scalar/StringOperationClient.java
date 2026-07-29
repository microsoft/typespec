package type.scalar;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.scalar.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class StringOperationClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringOperationClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    StringOperationClient(StringOperationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * get string value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return string value along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.String.get", requestContext,
            updatedContext -> this.serviceClient.getWithResponse(updatedContext));
    }

    /**
     * get string value.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return string value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public String get() {
        return getWithResponse(RequestContext.none()).getValue();
    }

    /**
     * put string value.
     * 
     * @param body _.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(String body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.String.put", requestContext,
            updatedContext -> this.serviceClient.putWithResponse(body, updatedContext));
    }

    /**
     * put string value.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(String body) {
        putWithResponse(body, RequestContext.none());
    }
}
