package parameters.basic.implementation;

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
 * An instance of this class provides access to all the operations defined in ExplicitBodies.
 */
public final class ExplicitBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExplicitBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BasicClientImpl client;

    /**
     * Initializes an instance of ExplicitBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExplicitBodiesImpl(BasicClientImpl client) {
        this.service = RestProxy.create(ExplicitBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for BasicClientExplicitBodies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "BasicClientExplicitB", host = "{endpoint}")
    public interface ExplicitBodiesService {
        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/basic/explicit-body/simple",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> simpleSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * The simple operation.
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
    public Response<Void> simpleWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.simpleSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
