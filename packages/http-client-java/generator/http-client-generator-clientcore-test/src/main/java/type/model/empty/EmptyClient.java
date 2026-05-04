package type.model.empty;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.model.empty.implementation.EmptyClientImpl;

/**
 * Initializes a new instance of the synchronous EmptyClient type.
 */
@ServiceClient(builder = EmptyClientBuilder.class)
public final class EmptyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final EmptyClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of EmptyClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    EmptyClient(EmptyClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The putEmpty operation.
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
    public Response<Void> putEmptyWithResponse(EmptyInput input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.putEmpty", requestContext,
            updatedContext -> this.serviceClient.putEmptyWithResponse(input, updatedContext));
    }

    /**
     * The putEmpty operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putEmpty(EmptyInput input) {
        putEmptyWithResponse(input, RequestContext.none());
    }

    /**
     * The getEmpty operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in operation return type along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<EmptyOutput> getEmptyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.getEmpty", requestContext,
            updatedContext -> this.serviceClient.getEmptyWithResponse(updatedContext));
    }

    /**
     * The getEmpty operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in operation return type.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public EmptyOutput getEmpty() {
        return getEmptyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The postRoundTripEmpty operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in both parameter and return type along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<EmptyInputOutput> postRoundTripEmptyWithResponse(EmptyInputOutput body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.postRoundTripEmpty", requestContext,
            updatedContext -> this.serviceClient.postRoundTripEmptyWithResponse(body, updatedContext));
    }

    /**
     * The postRoundTripEmpty operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in both parameter and return type.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public EmptyInputOutput postRoundTripEmpty(EmptyInputOutput body) {
        return postRoundTripEmptyWithResponse(body, RequestContext.none()).getValue();
    }
}
