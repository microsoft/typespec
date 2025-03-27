package streaming.jsonl.implementation;

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
 * An instance of this class provides access to all the operations defined in Basics.
 */
public final class BasicsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BasicsService service;

    /**
     * The service client containing this operation class.
     */
    private final JsonlClientImpl client;

    /**
     * Initializes an instance of BasicsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BasicsImpl(JsonlClientImpl client) {
        this.service = RestProxy.create(BasicsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for JsonlClientBasics to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "JsonlClientBasics", host = "{endpoint}")
    public interface BasicsService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/streaming/jsonl/basic/send",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendSync(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("application/jsonl") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/jsonl/basic/receive",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> receiveSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The send operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> sendWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/jsonl";
        return service.sendSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * The receive operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<BinaryData> receiveWithResponse(RequestOptions requestOptions) {
        final String accept = "application/jsonl";
        return service.receiveSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
