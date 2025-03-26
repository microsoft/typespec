package versioning.returntypechangedfrom.implementation;

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
import versioning.returntypechangedfrom.ReturnTypeChangedFromServiceVersion;
import versioning.returntypechangedfrom.Versions;

/**
 * Initializes a new instance of the ReturnTypeChangedFromClient type.
 */
public final class ReturnTypeChangedFromClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ReturnTypeChangedFromClientService service;

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
     * Need to be set as 'v1' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
    }

    /**
     * Service version.
     */
    private final ReturnTypeChangedFromServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public ReturnTypeChangedFromServiceVersion getServiceVersion() {
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
     * Initializes an instance of ReturnTypeChangedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public ReturnTypeChangedFromClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        ReturnTypeChangedFromServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.service = RestProxy.create(ReturnTypeChangedFromClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for ReturnTypeChangedFromClient to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(
        name = "ReturnTypeChangedFro",
        host = "{endpoint}/versioning/return-type-changed-from/api-version:{version}")
    public interface ReturnTypeChangedFromClientService {
        @HttpRequestInformation(method = HttpMethod.POST, path = "/test", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<String> testSync(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
    }

    /**
     * The test operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a sequence of textual characters.
     */
    public Response<String> testWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.testSync(this.getEndpoint(), this.getVersion(), contentType, accept, body, requestOptions);
    }
}
