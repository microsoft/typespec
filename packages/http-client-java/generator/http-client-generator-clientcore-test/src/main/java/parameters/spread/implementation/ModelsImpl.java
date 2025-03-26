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
 * An instance of this class provides access to all the operations defined in Models.
 */
public final class ModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpreadClientImpl client;

    /**
     * Initializes an instance of ModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelsImpl(SpreadClientImpl client) {
        this.service = RestProxy.create(ModelsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpreadClientModels to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "SpreadClientModels", host = "{endpoint}")
    public interface ModelsService {
        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/request-body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadAsRequestBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData bodyParameter,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-only-with-body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestOnlyWithBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-without-body/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestWithoutBodySync(@HostParam("endpoint") String endpoint,
            @PathParam("name") String name, @HeaderParam("test-header") String testHeader,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestSync(@HostParam("endpoint") String endpoint,
            @PathParam("name") String name, @HeaderParam("test-header") String testHeader,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-mix/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestMixSync(@HostParam("endpoint") String endpoint,
            @PathParam("name") String name, @HeaderParam("test-header") String testHeader,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData spreadCompositeRequestMixRequest, RequestOptions requestOptions);
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
     * @param bodyParameter The bodyParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadAsRequestBodyWithResponse(BinaryData bodyParameter, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadAsRequestBodySync(this.client.getEndpoint(), contentType, bodyParameter, requestOptions);
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
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
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadCompositeRequestOnlyWithBodyWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadCompositeRequestOnlyWithBodySync(this.client.getEndpoint(), contentType, body,
            requestOptions);
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadCompositeRequestWithoutBodyWithResponse(String name, String testHeader,
        RequestOptions requestOptions) {
        return service.spreadCompositeRequestWithoutBodySync(this.client.getEndpoint(), name, testHeader,
            requestOptions);
    }

    /**
     * The spreadCompositeRequest operation.
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
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadCompositeRequestWithResponse(String name, String testHeader, BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadCompositeRequestSync(this.client.getEndpoint(), name, testHeader, contentType, body,
            requestOptions);
    }

    /**
     * The spreadCompositeRequestMix operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param spreadCompositeRequestMixRequest The spreadCompositeRequestMixRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> spreadCompositeRequestMixWithResponse(String name, String testHeader,
        BinaryData spreadCompositeRequestMixRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.spreadCompositeRequestMixSync(this.client.getEndpoint(), name, testHeader, contentType,
            spreadCompositeRequestMixRequest, requestOptions);
    }
}
