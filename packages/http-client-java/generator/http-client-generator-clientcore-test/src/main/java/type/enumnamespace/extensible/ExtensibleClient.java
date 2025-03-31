package type.enumnamespace.extensible;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.enumnamespace.extensible.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous ExtensibleClient type.
 */
@ServiceClient(builder = ExtensibleClientBuilder.class)
public final class ExtensibleClient {
    @Metadata(generated = true)
    private final StringOperationsImpl serviceClient;

    /**
     * Initializes an instance of ExtensibleClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ExtensibleClient(StringOperationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The getKnownValue operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return days of the week.
     */
    @Metadata(generated = true)
    public Response<DaysOfWeekExtensibleEnum> getKnownValueWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getKnownValueWithResponse(requestOptions);
    }

    /**
     * The getUnknownValue operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return days of the week.
     */
    @Metadata(generated = true)
    public Response<DaysOfWeekExtensibleEnum> getUnknownValueWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getUnknownValueWithResponse(requestOptions);
    }

    /**
     * The putKnownValue operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putKnownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putKnownValueWithResponse(body, requestOptions);
    }

    /**
     * The putUnknownValue operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putUnknownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putUnknownValueWithResponse(body, requestOptions);
    }

    /**
     * The getKnownValue operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(generated = true)
    public DaysOfWeekExtensibleEnum getKnownValue() {
        // Generated convenience method for getKnownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getKnownValueWithResponse(requestOptions).getValue();
    }

    /**
     * The getUnknownValue operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(generated = true)
    public DaysOfWeekExtensibleEnum getUnknownValue() {
        // Generated convenience method for getUnknownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getUnknownValueWithResponse(requestOptions).getValue();
    }

    /**
     * The putKnownValue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putKnownValue(DaysOfWeekExtensibleEnum body) {
        // Generated convenience method for putKnownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putKnownValueWithResponse(BinaryData.fromObject(body == null ? null : body.getValue()), requestOptions)
            .getValue();
    }

    /**
     * The putUnknownValue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putUnknownValue(DaysOfWeekExtensibleEnum body) {
        // Generated convenience method for putUnknownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putUnknownValueWithResponse(BinaryData.fromObject(body == null ? null : body.getValue()), requestOptions)
            .getValue();
    }
}
