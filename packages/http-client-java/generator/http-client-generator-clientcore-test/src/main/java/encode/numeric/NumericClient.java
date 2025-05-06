package encode.numeric;

import encode.numeric.implementation.PropertiesImpl;
import encode.numeric.property.SafeintAsStringProperty;
import encode.numeric.property.Uint32AsStringProperty;
import encode.numeric.property.Uint8AsStringProperty;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the synchronous NumericClient type.
 */
@ServiceClient(builder = NumericClientBuilder.class)
public final class NumericClient {
    @Metadata(generated = true)
    private final PropertiesImpl serviceClient;

    /**
     * Initializes an instance of NumericClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NumericClient(PropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The safeintAsString operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: long (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<SafeintAsStringProperty> safeintAsStringWithResponse(BinaryData value,
        RequestOptions requestOptions) {
        return this.serviceClient.safeintAsStringWithResponse(value, requestOptions);
    }

    /**
     * The uint32AsStringOptional operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Integer (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Integer (Optional)
     * }
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Uint32AsStringProperty> uint32AsStringOptionalWithResponse(BinaryData value,
        RequestOptions requestOptions) {
        return this.serviceClient.uint32AsStringOptionalWithResponse(value, requestOptions);
    }

    /**
     * The uint8AsString operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: int (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Uint8AsStringProperty> uint8AsStringWithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.uint8AsStringWithResponse(value, requestOptions);
    }

    /**
     * The safeintAsString operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public SafeintAsStringProperty safeintAsString(SafeintAsStringProperty value) {
        // Generated convenience method for safeintAsStringWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return safeintAsStringWithResponse(BinaryData.fromObject(value), requestOptions).getValue();
    }

    /**
     * The uint32AsStringOptional operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Uint32AsStringProperty uint32AsStringOptional(Uint32AsStringProperty value) {
        // Generated convenience method for uint32AsStringOptionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return uint32AsStringOptionalWithResponse(BinaryData.fromObject(value), requestOptions).getValue();
    }

    /**
     * The uint8AsString operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Uint8AsStringProperty uint8AsString(Uint8AsStringProperty value) {
        // Generated convenience method for uint8AsStringWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return uint8AsStringWithResponse(BinaryData.fromObject(value), requestOptions).getValue();
    }
}
