package encode.numeric.implementation;

import encode.numeric.property.SafeintAsStringProperty;
import encode.numeric.property.Uint32AsStringProperty;
import encode.numeric.property.Uint8AsStringProperty;
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

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final NumericClientImpl client;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(NumericClientImpl client) {
        this.service = RestProxy.create(PropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for NumericClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "NumericClientPropert", host = "{endpoint}")
    public interface PropertiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/safeint",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SafeintAsStringProperty> safeintAsStringSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData value, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/uint32",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Uint32AsStringProperty> uint32AsStringOptionalSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData value, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/numeric/property/uint8",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Uint8AsStringProperty> uint8AsStringSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData value, RequestOptions requestOptions);
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
    public Response<SafeintAsStringProperty> safeintAsStringWithResponse(BinaryData value,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.safeintAsStringSync(this.client.getEndpoint(), contentType, accept, value, requestOptions);
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
    public Response<Uint32AsStringProperty> uint32AsStringOptionalWithResponse(BinaryData value,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.uint32AsStringOptionalSync(this.client.getEndpoint(), contentType, accept, value,
            requestOptions);
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
    public Response<Uint8AsStringProperty> uint8AsStringWithResponse(BinaryData value, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.uint8AsStringSync(this.client.getEndpoint(), contentType, accept, value, requestOptions);
    }
}
