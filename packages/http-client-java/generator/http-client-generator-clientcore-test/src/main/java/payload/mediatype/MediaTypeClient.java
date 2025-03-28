package payload.mediatype;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.mediatype.implementation.StringBodiesImpl;

/**
 * Initializes a new instance of the synchronous MediaTypeClient type.
 */
@ServiceClient(builder = MediaTypeClientBuilder.class)
public final class MediaTypeClient {
    @Metadata(generated = true)
    private final StringBodiesImpl serviceClient;

    /**
     * Initializes an instance of MediaTypeClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    MediaTypeClient(StringBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The sendAsText operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param text The text parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> sendAsTextWithResponse(BinaryData text, RequestOptions requestOptions) {
        return this.serviceClient.sendAsTextWithResponse(text, requestOptions);
    }

    /**
     * The getAsText operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public Response<String> getAsTextWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAsTextWithResponse(requestOptions);
    }

    /**
     * The sendAsJson operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param text The text parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> sendAsJsonWithResponse(BinaryData text, RequestOptions requestOptions) {
        return this.serviceClient.sendAsJsonWithResponse(text, requestOptions);
    }

    /**
     * The getAsJson operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public Response<String> getAsJsonWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAsJsonWithResponse(requestOptions);
    }

    /**
     * The sendAsText operation.
     * 
     * @param text The text parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void sendAsText(String text) {
        // Generated convenience method for sendAsTextWithResponse
        RequestOptions requestOptions = new RequestOptions();
        sendAsTextWithResponse(BinaryData.fromString(text), requestOptions).getValue();
    }

    /**
     * The getAsText operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public String getAsText() {
        // Generated convenience method for getAsTextWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAsTextWithResponse(requestOptions).getValue();
    }

    /**
     * The sendAsJson operation.
     * 
     * @param text The text parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void sendAsJson(String text) {
        // Generated convenience method for sendAsJsonWithResponse
        RequestOptions requestOptions = new RequestOptions();
        sendAsJsonWithResponse(BinaryData.fromObject(text), requestOptions).getValue();
    }

    /**
     * The getAsJson operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public String getAsJson() {
        // Generated convenience method for getAsJsonWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAsJsonWithResponse(requestOptions).getValue();
    }
}
