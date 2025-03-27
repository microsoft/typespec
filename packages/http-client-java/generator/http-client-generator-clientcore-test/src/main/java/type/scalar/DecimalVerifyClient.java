package type.scalar;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.math.BigDecimal;
import java.util.List;
import type.scalar.implementation.DecimalVerifiesImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class DecimalVerifyClient {
    @Metadata(generated = true)
    private final DecimalVerifiesImpl serviceClient;

    /**
     * Initializes an instance of DecimalVerifyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    DecimalVerifyClient(DecimalVerifiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The prepareVerify operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * [
     *     BigDecimal (Required)
     * ]
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<List<BigDecimal>> prepareVerifyWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.prepareVerifyWithResponse(requestOptions);
    }

    /**
     * The verify operation.
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
    public Response<Void> verifyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.verifyWithResponse(body, requestOptions);
    }

    /**
     * The prepareVerify operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public List<BigDecimal> prepareVerify() {
        // Generated convenience method for prepareVerifyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return prepareVerifyWithResponse(requestOptions).getValue();
    }

    /**
     * The verify operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void verify(BigDecimal body) {
        // Generated convenience method for verifyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        verifyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
