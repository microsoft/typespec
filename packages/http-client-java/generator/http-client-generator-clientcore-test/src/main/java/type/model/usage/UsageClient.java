package type.model.usage;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.usage.implementation.UsageClientImpl;

/**
 * Initializes a new instance of the synchronous UsageClient type.
 */
@ServiceClient(builder = UsageClientBuilder.class)
public final class UsageClient {
    @Metadata(generated = true)
    private final UsageClientImpl serviceClient;

    /**
     * Initializes an instance of UsageClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    UsageClient(UsageClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The input operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> inputWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.inputWithResponse(input, requestOptions);
    }

    /**
     * The output operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return record used in operation return type.
     */
    @Metadata(generated = true)
    public Response<OutputRecord> outputWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.outputWithResponse(requestOptions);
    }

    /**
     * The inputAndOutput operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProp: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return record used both as operation parameter and return type.
     */
    @Metadata(generated = true)
    public Response<InputOutputRecord> inputAndOutputWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.inputAndOutputWithResponse(body, requestOptions);
    }

    /**
     * The input operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void input(InputRecord input) {
        // Generated convenience method for inputWithResponse
        RequestOptions requestOptions = new RequestOptions();
        inputWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The output operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used in operation return type.
     */
    @Metadata(generated = true)
    public OutputRecord output() {
        // Generated convenience method for outputWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return outputWithResponse(requestOptions).getValue();
    }

    /**
     * The inputAndOutput operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used both as operation parameter and return type.
     */
    @Metadata(generated = true)
    public InputOutputRecord inputAndOutput(InputOutputRecord body) {
        // Generated convenience method for inputAndOutputWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return inputAndOutputWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
