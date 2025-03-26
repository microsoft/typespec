package versioning.removed.implementation;

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
import versioning.removed.ModelV2;
import versioning.removed.ModelV3;
import versioning.removed.RemovedServiceVersion;
import versioning.removed.Versions;

/**
 * Initializes a new instance of the RemovedClient type.
 */
public final class RemovedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RemovedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Need to be set as 'v1', 'v2preview' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1', 'v2preview' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
    }

    /**
     * Service version.
     */
    private final RemovedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RemovedServiceVersion getServiceVersion() {
        return this.serviceVersion;
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
     * Initializes an instance of RemovedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1', 'v2preview' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public RemovedClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        RemovedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.service = RestProxy.create(RemovedClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for RemovedClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RemovedClient", host = "{endpoint}/versioning/removed/api-version:{version}")
    public interface RemovedClientService {
        @HttpRequestInformation(method = HttpMethod.POST, path = "/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2Sync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v3", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV3> modelV3Sync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
    }

    /**
     * The v2 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMemberV2) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     *     enumProp: String(enumMemberV2) (Required)
     *     unionProp: BinaryData (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<ModelV2> v2WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.v2Sync(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestOptions);
    }

    /**
     * This operation will pass different paths and different request bodies based on different versions.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2Preview) (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: String (Required)
     *     enumProp: String(enumMemberV1/enumMemberV2Preview) (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<ModelV3> modelV3WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.modelV3Sync(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestOptions);
    }
}
