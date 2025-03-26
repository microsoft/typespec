package streaming.jsonl;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import streaming.jsonl.implementation.BasicsImpl;

/**
 * Initializes a new instance of the synchronous JsonlClient type.
 */
@ServiceClient(builder = JsonlClientBuilder.class)
public final class JsonlClient {
    @Metadata(generated = true)
    private final BasicsImpl serviceClient;

    /**
     * Initializes an instance of JsonlClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    JsonlClient(BasicsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
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
     * The receive operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<BinaryData> receiveWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.receiveWithResponse(requestOptions);
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
    public void send(BinaryData body) {
        // Generated convenience method for sendWithResponse
        RequestOptions requestOptions = new RequestOptions();
        sendWithResponse(body, requestOptions).getValue();
    }

    /**
     * The receive operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData receive() {
        // Generated convenience method for receiveWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return receiveWithResponse(requestOptions).getValue();
    }
}
