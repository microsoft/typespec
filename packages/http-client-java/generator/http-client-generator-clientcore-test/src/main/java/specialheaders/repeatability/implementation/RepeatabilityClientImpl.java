package specialheaders.repeatability.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Initializes a new instance of the RepeatabilityClient type.
 */
public final class RepeatabilityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RepeatabilityClientService service;

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
     * Initializes an instance of RepeatabilityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public RepeatabilityClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(RepeatabilityClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for RepeatabilityClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "RepeatabilityClient", host = "{endpoint}")
    public interface RepeatabilityClientService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/repeatability/immediateSuccess",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> immediateSuccessSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>repeatability-request-id</td><td>String</td><td>No</td><td>Repeatability request ID header</td></tr>
     * <tr><td>repeatability-first-sent</td><td>String</td><td>No</td><td>Repeatability first sent header as
     * HTTP-date</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> immediateSuccessWithResponse(RequestOptions requestOptions) {
        RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
        requestOptionsLocal.addRequestCallback(requestLocal -> {
            if (requestLocal.getHeaders().get(HttpHeaderName.fromString("repeatability-request-id")) == null) {
                requestLocal.getHeaders()
                    .set(HttpHeaderName.fromString("repeatability-request-id"), UUID.randomUUID().toString());
            }
        });
        requestOptionsLocal.addRequestCallback(requestLocal -> {
            if (requestLocal.getHeaders().get(HttpHeaderName.fromString("repeatability-first-sent")) == null) {
                requestLocal.getHeaders()
                    .set(HttpHeaderName.fromString("repeatability-first-sent"),
                        DateTimeRfc1123.toRfc1123String(OffsetDateTime.now()));
            }
        });
        return service.immediateSuccessSync(this.getEndpoint(), requestOptionsLocal);
    }
}
