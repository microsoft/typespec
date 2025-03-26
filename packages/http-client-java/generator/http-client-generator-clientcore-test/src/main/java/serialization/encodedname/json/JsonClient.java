package serialization.encodedname.json;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import serialization.encodedname.json.implementation.PropertiesImpl;
import serialization.encodedname.json.property.JsonEncodedNameModel;

/**
 * Initializes a new instance of the synchronous JsonClient type.
 */
@ServiceClient(builder = JsonClientBuilder.class)
public final class JsonClient {
    @Metadata(generated = true)
    private final PropertiesImpl serviceClient;

    /**
     * Initializes an instance of JsonClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    JsonClient(PropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     wireName: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> sendWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.sendWithResponse(body, requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     wireName: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<JsonEncodedNameModel> getWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(requestOptions);
    }

    /**
     * The send operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void send(JsonEncodedNameModel body) {
        // Generated convenience method for sendWithResponse
        RequestOptions requestOptions = new RequestOptions();
        sendWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public JsonEncodedNameModel get() {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(requestOptions).getValue();
    }
}
