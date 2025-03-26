package versioning.returntypechangedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.returntypechangedfrom.implementation.ReturnTypeChangedFromClientImpl;

/**
 * Initializes a new instance of the synchronous ReturnTypeChangedFromClient type.
 */
@ServiceClient(builder = ReturnTypeChangedFromClientBuilder.class)
public final class ReturnTypeChangedFromClient {
    @Metadata(generated = true)
    private final ReturnTypeChangedFromClientImpl serviceClient;

    /**
     * Initializes an instance of ReturnTypeChangedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ReturnTypeChangedFromClient(ReturnTypeChangedFromClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The test operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public Response<String> testWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.testWithResponse(body, requestOptions);
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters.
     */
    @Metadata(generated = true)
    public String test(String body) {
        // Generated convenience method for testWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return testWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
