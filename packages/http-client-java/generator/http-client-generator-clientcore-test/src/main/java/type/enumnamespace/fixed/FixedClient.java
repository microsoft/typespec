package type.enumnamespace.fixed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.enumnamespace.fixed.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous FixedClient type.
 */
@ServiceClient(builder = FixedClientBuilder.class)
public final class FixedClient {
    @Metadata(generated = true)
    private final StringOperationsImpl serviceClient;

    /**
     * Initializes an instance of FixedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    FixedClient(StringOperationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * getKnownValue.
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
    public Response<DaysOfWeekEnum> getKnownValueWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getKnownValueWithResponse(requestOptions);
    }

    /**
     * putKnownValue.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body _.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putKnownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putKnownValueWithResponse(body, requestOptions);
    }

    /**
     * putUnknownValue.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body _.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putUnknownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.putUnknownValueWithResponse(body, requestOptions);
    }

    /**
     * getKnownValue.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(generated = true)
    public DaysOfWeekEnum getKnownValue() {
        // Generated convenience method for getKnownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getKnownValueWithResponse(requestOptions).getValue();
    }

    /**
     * putKnownValue.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putKnownValue(DaysOfWeekEnum body) {
        // Generated convenience method for putKnownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putKnownValueWithResponse(BinaryData.fromObject(body == null ? null : body.toString()), requestOptions)
            .getValue();
    }

    /**
     * putUnknownValue.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putUnknownValue(DaysOfWeekEnum body) {
        // Generated convenience method for putUnknownValueWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putUnknownValueWithResponse(BinaryData.fromObject(body == null ? null : body.toString()), requestOptions)
            .getValue();
    }
}
