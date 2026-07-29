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
import type.scalar.implementation.BooleanOperationsImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class BooleanOperationClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BooleanOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BooleanOperationClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    BooleanOperationClient(BooleanOperationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * get boolean value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return boolean value along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Boolean> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.Boolean.get", requestContext,
            updatedContext -> this.serviceClient.getWithResponse(updatedContext));
    }

    /**
     * get boolean value.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return boolean value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public boolean get() {
        return getWithResponse(RequestContext.none()).getValue();
    }

    /**
     * put boolean value.
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
    public Response<Void> putWithResponse(boolean body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.Boolean.put", requestContext,
            updatedContext -> this.serviceClient.putWithResponse(body, updatedContext));
    }

    /**
     * put boolean value.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void put(boolean body) {
        putWithResponse(body, RequestContext.none());
    }
}
