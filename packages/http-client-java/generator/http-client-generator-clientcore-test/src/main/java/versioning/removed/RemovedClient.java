package versioning.removed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import versioning.removed.implementation.RemovedClientImpl;

/**
 * Initializes a new instance of the synchronous RemovedClient type.
 */
@ServiceClient(builder = RemovedClientBuilder.class)
public final class RemovedClient {
    @Metadata(generated = true)
    private final RemovedClientImpl serviceClient;

    /**
     * Initializes an instance of RemovedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RemovedClient(RemovedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The v2 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMemberV2) (Required)
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
     *     enumProp: String(enumMemberV2) (Required)
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
     * This operation will pass different paths and different request bodies based on different versions.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2Preview) (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2Preview) (Required)
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
    public Response<ModelV3> modelV3WithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.modelV3WithResponse(body, requestOptions);
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

    /**
     * This operation will pass different paths and different request bodies based on different versions.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public ModelV3 modelV3(ModelV3 body) {
        // Generated convenience method for modelV3WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return modelV3WithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
