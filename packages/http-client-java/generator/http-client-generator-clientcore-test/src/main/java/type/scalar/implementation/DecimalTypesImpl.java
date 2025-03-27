package type.scalar.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.math.BigDecimal;

/**
 * An instance of this class provides access to all the operations defined in DecimalTypes.
 */
public final class DecimalTypesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DecimalTypesService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * Initializes an instance of DecimalTypesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DecimalTypesImpl(ScalarClientImpl client) {
        this.service = RestProxy.create(DecimalTypesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ScalarClientDecimalTypes to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "ScalarClientDecimalT", host = "{endpoint}")
    public interface DecimalTypesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal/response_body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BigDecimal> responseBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/scalar/decimal/resquest_body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requestBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/scalar/decimal/request_parameter",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requestParameterSync(@HostParam("endpoint") String endpoint,
            @QueryParam("value") BigDecimal value, RequestOptions requestOptions);
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
     * @return a decimal number with any length and precision.
     */
    public Response<BigDecimal> responseBodyWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.responseBodySync(this.client.getEndpoint(), accept, requestOptions);
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
    public Response<Void> requestBodyWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.requestBodySync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> requestParameterWithResponse(BigDecimal value, RequestOptions requestOptions) {
        return service.requestParameterSync(this.client.getEndpoint(), value, requestOptions);
    }
}
