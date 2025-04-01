package type.model.inheritance.notdiscriminated.implementation;

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
import type.model.inheritance.notdiscriminated.Siamese;

/**
 * Initializes a new instance of the NotDiscriminatedClient type.
 */
public final class NotDiscriminatedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotDiscriminatedClientService service;

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
     * Initializes an instance of NotDiscriminatedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public NotDiscriminatedClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(NotDiscriminatedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for NotDiscriminatedClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "NotDiscriminatedClie", host = "{endpoint}")
    public interface NotDiscriminatedClientService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postValidSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Siamese> getValidSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Siamese> putValidSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData input, RequestOptions requestOptions);
    }

    /**
     * The postValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> postValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.postValidSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The getValid operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the third level model in the normal multiple levels inheritance.
     */
    public Response<Siamese> getValidWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getValidSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The putValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the third level model in the normal multiple levels inheritance.
     */
    public Response<Siamese> putValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.putValidSync(this.getEndpoint(), contentType, accept, input, requestOptions);
    }
}
