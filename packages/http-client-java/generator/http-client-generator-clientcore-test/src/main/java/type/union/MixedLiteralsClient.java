package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.union.implementation.MixedLiteralsImpl;
import type.union.implementation.SendRequest1;

/**
 * Initializes a new instance of the synchronous UnionClient type.
 */
@ServiceClient(builder = UnionClientBuilder.class)
public final class MixedLiteralsClient {
    @Metadata(generated = true)
    private final MixedLiteralsImpl serviceClient;

    /**
     * Initializes an instance of MixedLiteralsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    MixedLiteralsClient(MixedLiteralsImpl serviceClient) {
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
     *         stringLiteral: BinaryData (Required)
     *         intLiteral: BinaryData (Required)
     *         floatLiteral: BinaryData (Required)
     *         booleanLiteral: BinaryData (Required)
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
    public Response<GetResponse1> getWithResponse(RequestOptions requestOptions) {
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
     *         stringLiteral: BinaryData (Required)
     *         intLiteral: BinaryData (Required)
     *         floatLiteral: BinaryData (Required)
     *         booleanLiteral: BinaryData (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param sendRequest1 The sendRequest1 parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> sendWithResponse(BinaryData sendRequest1, RequestOptions requestOptions) {
        return this.serviceClient.sendWithResponse(sendRequest1, requestOptions);
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public GetResponse1 get() {
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
    public void send(MixedLiteralsCases prop) {
        // Generated convenience method for sendWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SendRequest1 sendRequest1Obj = new SendRequest1(prop);
        BinaryData sendRequest1 = BinaryData.fromObject(sendRequest1Obj);
        sendWithResponse(sendRequest1, requestOptions).getValue();
    }
}
