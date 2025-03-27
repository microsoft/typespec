package versioning.added;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.added.implementation.InterfaceV2sImpl;

/**
 * Initializes a new instance of the synchronous AddedClient type.
 */
@ServiceClient(builder = AddedClientBuilder.class)
public final class InterfaceV2Client {
    @Metadata(generated = true)
    private final InterfaceV2sImpl serviceClient;

    /**
     * Initializes an instance of InterfaceV2Client class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    InterfaceV2Client(InterfaceV2sImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The v2InInterface operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMember) (Required)
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
     *     prop: String (Required)
     *     enumProp: String(enumMember) (Required)
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
    public Response<ModelV2> v2InInterfaceWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.v2InInterfaceWithResponse(body, requestOptions);
    }

    /**
     * The v2InInterface operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public ModelV2 v2InInterface(ModelV2 body) {
        // Generated convenience method for v2InInterfaceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return v2InInterfaceWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
