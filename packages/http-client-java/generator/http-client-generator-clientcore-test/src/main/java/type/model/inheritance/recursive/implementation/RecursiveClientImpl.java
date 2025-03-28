package type.model.inheritance.recursive.implementation;

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
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.recursive.Extension;

/**
 * Initializes a new instance of the RecursiveClient type.
 */
public final class RecursiveClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RecursiveClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * Initializes an instance of RecursiveClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public RecursiveClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(RecursiveClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for RecursiveClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "RecursiveClient", host = "{endpoint}")
    public interface RecursiveClientService {
        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/recursive",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putSync(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BinaryData input, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/recursive",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Extension> getSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The put operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     extension (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     level: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     extension (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     level: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return extension.
     */
    public Response<Extension> getWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.getEndpoint(), accept, requestOptions);
    }
}
