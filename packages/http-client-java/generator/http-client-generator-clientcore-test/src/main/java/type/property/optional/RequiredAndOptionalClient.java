package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.property.optional.implementation.RequiredAndOptionalsImpl;

/**
 * Initializes a new instance of the synchronous OptionalClient type.
 */
@ServiceClient(builder = OptionalClientBuilder.class)
public final class RequiredAndOptionalClient {
    @Metadata(generated = true)
    private final RequiredAndOptionalsImpl serviceClient;

    /**
     * Initializes an instance of RequiredAndOptionalClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RequiredAndOptionalClient(RequiredAndOptionalsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Get models that will return all properties in the model.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return all properties in the model.
     */
    @Metadata(generated = true)
    public Response<RequiredAndOptionalProperty> getAllWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAllWithResponse(requestOptions);
    }

    /**
     * Get models that will return only the required properties.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return only the required properties.
     */
    @Metadata(generated = true)
    public Response<RequiredAndOptionalProperty> getRequiredOnlyWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getRequiredOnlyWithResponse(requestOptions);
    }

    /**
     * Put a body with all properties present.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
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
    public Response<Void> putAllWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putAllWithResponse(body, requestOptions);
    }

    /**
     * Put a body with only required properties.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
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
    public Response<Void> putRequiredOnlyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putRequiredOnlyWithResponse(body, requestOptions);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @Metadata(generated = true)
    public RequiredAndOptionalProperty getAll() {
        // Generated convenience method for getAllWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAllWithResponse(requestOptions).getValue();
    }

    /**
     * Get models that will return only the required properties.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return only the required properties.
     */
    @Metadata(generated = true)
    public RequiredAndOptionalProperty getRequiredOnly() {
        // Generated convenience method for getRequiredOnlyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getRequiredOnlyWithResponse(requestOptions).getValue();
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putAll(RequiredAndOptionalProperty body) {
        // Generated convenience method for putAllWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putAllWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * Put a body with only required properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putRequiredOnly(RequiredAndOptionalProperty body) {
        // Generated convenience method for putRequiredOnlyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putRequiredOnlyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
