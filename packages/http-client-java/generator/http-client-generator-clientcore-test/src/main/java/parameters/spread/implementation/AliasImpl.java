package parameters.spread.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * An instance of this class provides access to all the operations defined in Alias.
 */
public final class AliasImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final AliasService service;

    /**
     * The service client containing this operation class.
     */
    private final SpreadClientImpl client;

    /**
     * Initializes an instance of AliasImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    AliasImpl(SpreadClientImpl client) {
        this.service = RestProxy.create(AliasService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpreadClientAlias to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "SpreadClientAlias", host = "{endpoint}")
    public interface AliasService {
        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/alias/request-body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadAsRequestBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadAsRequestBodyRequest, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/spread/alias/inner-model-parameter/{id}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadParameterWithInnerModelSync(@HostParam("endpoint") String endpoint,
            @PathParam("id") String id, @HeaderParam("x-ms-test-header") String xMsTestHeader,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadParameterWithInnerModelRequest,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/alias/request-parameter/{id}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadAsRequestParameterSync(@HostParam("endpoint") String endpoint, @PathParam("id") String id,
            @HeaderParam("x-ms-test-header") String xMsTestHeader, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadAsRequestParameterRequest, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/alias/multiple-parameters/{id}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadWithMultipleParametersSync(@HostParam("endpoint") String endpoint,
            @PathParam("id") String id, @HeaderParam("x-ms-test-header") String xMsTestHeader,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadWithMultipleParametersRequest,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/spread/alias/inner-alias-parameter/{id}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadParameterWithInnerAliasSync(@HostParam("endpoint") String endpoint,
            @PathParam("id") String id, @HeaderParam("x-ms-test-header") String xMsTestHeader,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadParameterWithInnerAliasRequest,
            RequestOptions requestOptions);
    }

    /**
     * The spreadAsRequestBody operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param spreadAsRequestBodyRequest The spreadAsRequestBodyRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadAsRequestBodyWithResponse(BinaryData spreadAsRequestBodyRequest,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadAsRequestBodySync(this.client.getEndpoint(), contentType, spreadAsRequestBodyRequest,
            requestOptions);
    }

    /**
     * The spreadParameterWithInnerModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadParameterWithInnerModelRequest The spreadParameterWithInnerModelRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadParameterWithInnerModelWithResponse(String id, String xMsTestHeader,
        BinaryData spreadParameterWithInnerModelRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadParameterWithInnerModelSync(this.client.getEndpoint(), id, xMsTestHeader, contentType,
            spreadParameterWithInnerModelRequest, requestOptions);
    }

    /**
     * The spreadAsRequestParameter operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadAsRequestParameterRequest The spreadAsRequestParameterRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadAsRequestParameterWithResponse(String id, String xMsTestHeader,
        BinaryData spreadAsRequestParameterRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadAsRequestParameterSync(this.client.getEndpoint(), id, xMsTestHeader, contentType,
            spreadAsRequestParameterRequest, requestOptions);
    }

    /**
     * The spreadWithMultipleParameters operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredString: String (Required)
     *     optionalInt: Integer (Optional)
     *     requiredIntList (Required): [
     *         int (Required)
     *     ]
     *     optionalStringList (Optional): [
     *         String (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadWithMultipleParametersRequest The spreadWithMultipleParametersRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadWithMultipleParametersWithResponse(String id, String xMsTestHeader,
        BinaryData spreadWithMultipleParametersRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadWithMultipleParametersSync(this.client.getEndpoint(), id, xMsTestHeader, contentType,
            spreadWithMultipleParametersRequest, requestOptions);
    }

    /**
     * spread an alias with contains another alias property as body.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadParameterWithInnerAliasRequest The spreadParameterWithInnerAliasRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadParameterWithInnerAliasWithResponse(String id, String xMsTestHeader,
        BinaryData spreadParameterWithInnerAliasRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadParameterWithInnerAliasSync(this.client.getEndpoint(), id, xMsTestHeader, contentType,
            spreadParameterWithInnerAliasRequest, requestOptions);
    }
}
