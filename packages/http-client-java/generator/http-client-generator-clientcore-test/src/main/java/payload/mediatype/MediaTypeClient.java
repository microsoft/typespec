package payload.mediatype;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.mediatype.implementation.StringBodiesImpl;

/**
 * Initializes a new instance of the synchronous MediaTypeClient type.
 */
@ServiceClient(builder = MediaTypeClientBuilder.class)
public final class MediaTypeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringBodiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of MediaTypeClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    MediaTypeClient(StringBodiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The sendAsText operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsTextWithResponse(String text, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.sendAsText", requestContext,
            updatedContext -> this.serviceClient.sendAsTextWithResponse(text, updatedContext));
    }

    /**
     * The sendAsText operation.
     * 
     * @param text The text parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void sendAsText(String text) {
        sendAsTextWithResponse(text, RequestContext.none());
    }

    /**
     * The getAsText operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.getAsText", requestContext,
            updatedContext -> this.serviceClient.getAsTextWithResponse(updatedContext));
    }

    /**
     * The getAsText operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public String getAsText() {
        return getAsTextWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The sendAsJson operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsJsonWithResponse(String text, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.sendAsJson", requestContext,
            updatedContext -> this.serviceClient.sendAsJsonWithResponse(text, updatedContext));
    }

    /**
     * The sendAsJson operation.
     * 
     * @param text The text parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void sendAsJson(String text) {
        sendAsJsonWithResponse(text, RequestContext.none());
    }

    /**
     * The getAsJson operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsJsonWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.getAsJson", requestContext,
            updatedContext -> this.serviceClient.getAsJsonWithResponse(updatedContext));
    }

    /**
     * The getAsJson operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public String getAsJson() {
        return getAsJsonWithResponse(RequestContext.none()).getValue();
    }
}
