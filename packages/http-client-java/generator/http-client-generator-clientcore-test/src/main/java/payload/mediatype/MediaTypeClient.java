package payload.mediatype;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import payload.mediatype.implementation.StringBodiesImpl;

/**
 * Initializes a new instance of the synchronous MediaTypeClient type.
 */
@ServiceClient(builder = MediaTypeClientBuilder.class)
public final class MediaTypeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringBodiesImpl serviceClient;

    /**
     * Initializes an instance of MediaTypeClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    MediaTypeClient(StringBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The sendAsText operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsTextWithResponse(String text, RequestContext requestContext) {
        return this.serviceClient.sendAsTextWithResponse(text, requestContext);
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
        this.serviceClient.sendAsText(text);
    }

    /**
     * The getAsText operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsTextWithResponse(RequestContext requestContext) {
        return this.serviceClient.getAsTextWithResponse(requestContext);
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
        return this.serviceClient.getAsText();
    }

    /**
     * The sendAsJson operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsJsonWithResponse(String text, RequestContext requestContext) {
        return this.serviceClient.sendAsJsonWithResponse(text, requestContext);
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
        this.serviceClient.sendAsJson(text);
    }

    /**
     * The getAsJson operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsJsonWithResponse(RequestContext requestContext) {
        return this.serviceClient.getAsJsonWithResponse(requestContext);
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
        return this.serviceClient.getAsJson();
    }
}
