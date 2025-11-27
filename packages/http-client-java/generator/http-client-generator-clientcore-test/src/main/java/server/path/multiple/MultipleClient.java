package server.path.multiple;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import server.path.multiple.implementation.MultipleClientImpl;

/**
 * Initializes a new instance of the synchronous MultipleClient type.
 */
@ServiceClient(builder = MultipleClientBuilder.class)
public final class MultipleClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final MultipleClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of MultipleClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    MultipleClient(MultipleClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The noOperationParams operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> noOperationParamsWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Path.Multiple.noOperationParams", requestContext,
            updatedContext -> this.serviceClient.noOperationParamsWithResponse(updatedContext));
    }

    /**
     * The noOperationParams operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void noOperationParams() {
        noOperationParamsWithResponse(RequestContext.none());
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOperationPathParamWithResponse(String keyword, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Path.Multiple.withOperationPathParam",
            requestContext,
            updatedContext -> this.serviceClient.withOperationPathParamWithResponse(keyword, updatedContext));
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withOperationPathParam(String keyword) {
        withOperationPathParamWithResponse(keyword, RequestContext.none());
    }
}
