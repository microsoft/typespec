package versioning.madeoptional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.madeoptional.implementation.MadeOptionalClientImpl;

/**
 * Initializes a new instance of the synchronous MadeOptionalClient type.
 */
@ServiceClient(builder = MadeOptionalClientBuilder.class)
public final class MadeOptionalClient {
    @Metadata(generated = true)
    private final MadeOptionalClientImpl serviceClient;

    /**
     * Initializes an instance of MadeOptionalClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    MadeOptionalClient(MadeOptionalClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The test operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>param</td><td>String</td><td>No</td><td>The param parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     changedProp: String (Optional)
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
     *     changedProp: String (Optional)
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
    public Response<TestModel> testWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.testWithResponse(body, requestOptions);
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TestModel test(TestModel body, String param) {
        // Generated convenience method for testWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (param != null) {
            requestOptions.addQueryParam("param", param);
        }
        return testWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The test operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TestModel test(TestModel body) {
        // Generated convenience method for testWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return testWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
