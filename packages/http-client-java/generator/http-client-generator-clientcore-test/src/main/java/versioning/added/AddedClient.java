package versioning.added;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.added.implementation.AddedClientImpl;

/**
 * Initializes a new instance of the synchronous AddedClient type.
 */
@ServiceClient(builder = AddedClientBuilder.class)
public final class AddedClient {
    @Metadata(generated = true)
    private final AddedClientImpl serviceClient;

    /**
     * Initializes an instance of AddedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    AddedClient(AddedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The v1 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2) (Required)
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
     *     enumProp: String(enumMemberV1/enumMemberV2) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<ModelV1> v1WithResponse(String headerV2, BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.v1WithResponse(headerV2, body, requestOptions);
    }

    /**
     * The v2 operation.
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
    public Response<ModelV2> v2WithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.v2WithResponse(body, requestOptions);
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public ModelV1 v1(String headerV2, ModelV1 body) {
        // Generated convenience method for v1WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return v1WithResponse(headerV2, BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public ModelV2 v2(ModelV2 body) {
        // Generated convenience method for v2WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return v2WithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
