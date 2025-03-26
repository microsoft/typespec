package response.statuscoderange.implementation;

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
import io.clientcore.core.http.pipeline.HttpPipeline;
import response.statuscoderange.DefaultError;
import response.statuscoderange.ErrorInRange;
import response.statuscoderange.NotFoundError;
import response.statuscoderange.Standard4XXError;

/**
 * Initializes a new instance of the StatusCodeRangeClient type.
 */
public final class StatusCodeRangeClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StatusCodeRangeClientService service;

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
     * Initializes an instance of StatusCodeRangeClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public StatusCodeRangeClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(StatusCodeRangeClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for StatusCodeRangeClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "StatusCodeRangeClien", host = "{endpoint}")
    public interface StatusCodeRangeClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/response/status-code-range/error-response-status-code-in-range",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(
            statusCode = { 494, 495, 496, 497, 498, 499 },
            exceptionBodyClass = ErrorInRange.class)
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = DefaultError.class)
        Response<Void> errorResponseStatusCodeInRangeSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/response/status-code-range/error-response-status-code-404",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499 },
            exceptionBodyClass = Standard4XXError.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundError.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> errorResponseStatusCode404Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> errorResponseStatusCodeInRangeWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.errorResponseStatusCodeInRangeSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> errorResponseStatusCode404WithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.errorResponseStatusCode404Sync(this.getEndpoint(), accept, requestOptions);
    }
}
