package payload.contentnegotiation.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.contentnegotiation.differentbody.PngImageAsJson;

/**
 * An instance of this class provides access to all the operations defined in DifferentBodies.
 */
public final class DifferentBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DifferentBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ContentNegotiationClientImpl client;

    /**
     * Initializes an instance of DifferentBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DifferentBodiesImpl(ContentNegotiationClientImpl client) {
        this.service = RestProxy.create(DifferentBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ContentNegotiationClientDifferentBodies to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "ContentNegotiationCl", host = "{endpoint}")
    public interface DifferentBodiesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/content-negotiation/different-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> getAvatarAsPngSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/content-negotiation/different-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PngImageAsJson> getAvatarAsJsonSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("accept") String accept, RequestOptions requestOptions);
    }

    /**
     * The getAvatarAsPng operation.
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
    public Response<BinaryData> getAvatarAsPngWithResponse(RequestOptions requestOptions) {
        final String accept = "image/png";
        return service.getAvatarAsPngSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * The getAvatarAsJson operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     content: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<PngImageAsJson> getAvatarAsJsonWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getAvatarAsJsonSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
