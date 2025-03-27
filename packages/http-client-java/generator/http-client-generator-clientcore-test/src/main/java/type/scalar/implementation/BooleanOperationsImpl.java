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

/**
 * An instance of this class provides access to all the operations defined in BooleanOperations.
 */
public final class BooleanOperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BooleanOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * Initializes an instance of BooleanOperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BooleanOperationsImpl(ScalarClientImpl client) {
        this.service = RestProxy.create(BooleanOperationsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ScalarClientBooleanOperations to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "ScalarClientBooleanO", host = "{endpoint}")
    public interface BooleanOperationsService {
        @HttpRequestInformation(method = HttpMethod.GET, path = "/type/scalar/boolean", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Boolean> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.PUT, path = "/type/scalar/boolean", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putSync(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
    }

    /**
     * get boolean value.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * boolean
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return boolean value.
     */
    public Response<Boolean> getWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * put boolean value.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * boolean
     * }
     * </pre>
     * 
     * @param body _.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
