package versioning.renamedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.renamedfrom.implementation.RenamedFromClientImpl;

/**
 * Initializes a new instance of the synchronous RenamedFromClient type.
 */
@ServiceClient(builder = RenamedFromClientBuilder.class)
public final class RenamedFromClient {
    @Metadata(generated = true)
    private final RenamedFromClientImpl serviceClient;

    /**
     * Initializes an instance of RenamedFromClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RenamedFromClient(RenamedFromClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The newOp operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     newProp: String (Required)
     *     enumProp: String(newEnumMember) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<NewModel> newOpWithResponse(String newQuery, BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.newOpWithResponse(newQuery, body, requestOptions);
    }

    /**
     * The newOp operation.
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public NewModel newOp(String newQuery, NewModel body) {
        // Generated convenience method for newOpWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return newOpWithResponse(newQuery, BinaryData.fromObject(body), requestOptions).getValue();
    }
}
