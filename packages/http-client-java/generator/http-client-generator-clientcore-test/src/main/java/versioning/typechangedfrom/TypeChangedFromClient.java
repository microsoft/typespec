package versioning.typechangedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.typechangedfrom.implementation.TypeChangedFromClientImpl;

/**
 * Initializes a new instance of the synchronous TypeChangedFromClient type.
 */
@ServiceClient(builder = TypeChangedFromClientBuilder.class)
public final class TypeChangedFromClient {
    @Metadata(generated = true)
    private final TypeChangedFromClientImpl serviceClient;

    /**
     * Initializes an instance of TypeChangedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    TypeChangedFromClient(TypeChangedFromClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The test operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     changedProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     changedProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<TestModel> testWithResponse(String param, BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.testWithResponse(param, body, requestOptions);
    }

    /**
     * The test operation.
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TestModel test(String param, TestModel body) {
        // Generated convenience method for testWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return testWithResponse(param, BinaryData.fromObject(body), requestOptions).getValue();
    }
}
