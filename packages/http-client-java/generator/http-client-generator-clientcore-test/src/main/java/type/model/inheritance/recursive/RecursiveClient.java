package type.model.inheritance.recursive;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.recursive.implementation.RecursiveClientImpl;

/**
 * Initializes a new instance of the synchronous RecursiveClient type.
 */
@ServiceClient(builder = RecursiveClientBuilder.class)
public final class RecursiveClient {
    @Metadata(generated = true)
    private final RecursiveClientImpl serviceClient;

    /**
     * Initializes an instance of RecursiveClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RecursiveClient(RecursiveClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The put operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     extension (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     level: int (Required)
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
    public Response<Void> putWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putWithResponse(input, requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     extension (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     level: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return extension.
     */
    @Metadata(generated = true)
    public Response<Extension> getWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(requestOptions);
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void put(Extension input) {
        // Generated convenience method for putWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The get operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return extension.
     */
    @Metadata(generated = true)
    public Extension get() {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(requestOptions).getValue();
    }
}
