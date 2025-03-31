package type.scalar.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.math.BigDecimal;
import java.util.List;

/**
 * An instance of this class provides access to all the operations defined in Decimal128Verifies.
 */
public final class Decimal128VerifiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final Decimal128VerifiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * Initializes an instance of Decimal128VerifiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    Decimal128VerifiesImpl(ScalarClientImpl client) {
        this.service = RestProxy.create(Decimal128VerifiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ScalarClientDecimal128Verifies to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "ScalarClientDecimal1", host = "{endpoint}")
    public interface Decimal128VerifiesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal128/prepare_verify",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<List<BigDecimal>> prepareVerifySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/scalar/decimal128/verify",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> verifySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
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
    public Response<List<BigDecimal>> prepareVerifyWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.prepareVerifySync(this.client.getEndpoint(), accept, requestOptions);
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
    public Response<Void> verifyWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.verifySync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
