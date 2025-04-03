package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.union.implementation.SendRequest7;
import type.union.implementation.StringAndArraysImpl;

/**
 * Initializes a new instance of the synchronous UnionClient type.
 */
@ServiceClient(builder = UnionClientBuilder.class)
public final class StringAndArrayClient {
    @Metadata(generated = true)
    private final StringAndArraysImpl serviceClient;

    /**
     * Initializes an instance of StringAndArrayClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    StringAndArrayClient(StringAndArraysImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop (Required): {
     *         string: BinaryData (Required)
     *         array: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<GetResponse7> getWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(requestOptions);
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop (Required): {
     *         string: BinaryData (Required)
     *         array: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param sendRequest7 The sendRequest7 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> sendWithResponse(BinaryData sendRequest7, RequestOptions requestOptions) {
        return this.serviceClient.sendWithResponse(sendRequest7, requestOptions);
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public GetResponse7 get() {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(requestOptions).getValue();
    }

    /**
     * The send operation.
     * 
     * @param prop The prop parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void send(StringAndArrayCases prop) {
        // Generated convenience method for sendWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SendRequest7 sendRequest7Obj = new SendRequest7(prop);
        BinaryData sendRequest7 = BinaryData.fromObject(sendRequest7Obj);
        sendWithResponse(sendRequest7, requestOptions).getValue();
    }
}
