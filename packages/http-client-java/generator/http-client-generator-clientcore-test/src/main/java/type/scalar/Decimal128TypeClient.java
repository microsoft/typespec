package type.scalar;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.math.BigDecimal;
import type.scalar.implementation.Decimal128TypesImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class Decimal128TypeClient {
    @Metadata(generated = true)
    private final Decimal128TypesImpl serviceClient;

    /**
     * Initializes an instance of Decimal128TypeClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    Decimal128TypeClient(Decimal128TypesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The responseBody operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BigDecimal
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a 128-bit decimal number.
     */
    @Metadata(generated = true)
    public Response<BigDecimal> responseBodyWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.responseBodyWithResponse(requestOptions);
    }

    /**
     * The requestBody operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BigDecimal
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> requestBodyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.requestBodyWithResponse(body, requestOptions);
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> requestParameterWithResponse(BigDecimal value, RequestOptions requestOptions) {
        return this.serviceClient.requestParameterWithResponse(value, requestOptions);
    }

    /**
     * The responseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a 128-bit decimal number.
     */
    @Metadata(generated = true)
    public BigDecimal responseBody() {
        // Generated convenience method for responseBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return responseBodyWithResponse(requestOptions).getValue();
    }

    /**
     * The requestBody operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void requestBody(BigDecimal body) {
        // Generated convenience method for requestBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        requestBodyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void requestParameter(BigDecimal value) {
        // Generated convenience method for requestParameterWithResponse
        RequestOptions requestOptions = new RequestOptions();
        requestParameterWithResponse(value, requestOptions).getValue();
    }
}
