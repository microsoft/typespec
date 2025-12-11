package encode.array;

import encode.array.implementation.PropertiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the synchronous ArrayClient type.
 */
@ServiceClient(builder = ArrayClientBuilder.class)
public final class ArrayClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PropertiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ArrayClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ArrayClient(PropertiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The commaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedArrayProperty> commaDelimitedWithResponse(CommaDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.commaDelimited", requestContext,
            updatedContext -> this.serviceClient.commaDelimitedWithResponse(body, updatedContext));
    }

    /**
     * The commaDelimited operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public CommaDelimitedArrayProperty commaDelimited(CommaDelimitedArrayProperty body) {
        return commaDelimitedWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The spaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedArrayProperty> spaceDelimitedWithResponse(SpaceDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.spaceDelimited", requestContext,
            updatedContext -> this.serviceClient.spaceDelimitedWithResponse(body, updatedContext));
    }

    /**
     * The spaceDelimited operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public SpaceDelimitedArrayProperty spaceDelimited(SpaceDelimitedArrayProperty body) {
        return spaceDelimitedWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The pipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedArrayProperty> pipeDelimitedWithResponse(PipeDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.pipeDelimited", requestContext,
            updatedContext -> this.serviceClient.pipeDelimitedWithResponse(body, updatedContext));
    }

    /**
     * The pipeDelimited operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PipeDelimitedArrayProperty pipeDelimited(PipeDelimitedArrayProperty body) {
        return pipeDelimitedWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The newlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedArrayProperty> newlineDelimitedWithResponse(NewlineDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.newlineDelimited", requestContext,
            updatedContext -> this.serviceClient.newlineDelimitedWithResponse(body, updatedContext));
    }

    /**
     * The newlineDelimited operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public NewlineDelimitedArrayProperty newlineDelimited(NewlineDelimitedArrayProperty body) {
        return newlineDelimitedWithResponse(body, RequestContext.none()).getValue();
    }
}
