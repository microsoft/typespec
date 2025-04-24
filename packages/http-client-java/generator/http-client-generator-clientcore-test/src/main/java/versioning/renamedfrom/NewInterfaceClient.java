package versioning.renamedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.renamedfrom.implementation.NewInterfacesImpl;

/**
 * Initializes a new instance of the synchronous RenamedFromClient type.
 */
@ServiceClient(builder = RenamedFromClientBuilder.class)
public final class NewInterfaceClient {
    @Metadata(generated = true)
    private final NewInterfacesImpl serviceClient;

    /**
     * Initializes an instance of NewInterfaceClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NewInterfaceClient(NewInterfacesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The newOpInNewInterface operation.
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
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<NewModel> newOpInNewInterfaceWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.newOpInNewInterfaceWithResponse(body, requestOptions);
    }

    /**
     * The newOpInNewInterface operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public NewModel newOpInNewInterface(NewModel body) {
        // Generated convenience method for newOpInNewInterfaceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return newOpInNewInterfaceWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
