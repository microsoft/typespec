package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.property.optional.implementation.PlainDatesImpl;

/**
 * Initializes a new instance of the synchronous OptionalClient type.
 */
@ServiceClient(builder = OptionalClientBuilder.class)
public final class PlainDateClient {
    @Metadata(generated = true)
    private final PlainDatesImpl serviceClient;

    /**
     * Initializes an instance of PlainDateClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PlainDateClient(PlainDatesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Get models that will return all properties in the model.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return all properties in the model.
     */
    @Metadata(generated = true)
    public Response<PlainDateProperty> getAllWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAllWithResponse(requestOptions);
    }

    /**
     * Get models that will return the default object.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return the default object.
     */
    @Metadata(generated = true)
    public Response<PlainDateProperty> getDefaultWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getDefaultWithResponse(requestOptions);
    }

    /**
     * Put a body with all properties present.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
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
     * Put a body with default properties.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
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
    public Response<Void> putDefaultWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putDefaultWithResponse(body, requestOptions);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @Metadata(generated = true)
    public PlainDateProperty getAll() {
        // Generated convenience method for getAllWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAllWithResponse(requestOptions).getValue();
    }

    /**
     * Get models that will return the default object.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object.
     */
    @Metadata(generated = true)
    public PlainDateProperty getDefault() {
        // Generated convenience method for getDefaultWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getDefaultWithResponse(requestOptions).getValue();
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
    public void putAll(PlainDateProperty body) {
        // Generated convenience method for putAllWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putAllWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putDefault(PlainDateProperty body) {
        // Generated convenience method for putDefaultWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putDefaultWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
