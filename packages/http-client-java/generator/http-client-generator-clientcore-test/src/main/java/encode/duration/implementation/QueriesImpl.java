package encode.duration.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Queries.
 */
public final class QueriesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueriesService service;

    /**
     * The service client containing this operation class.
     */
    private final DurationClientImpl client;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(DurationClientImpl client) {
        this.service = RestProxy.create(QueriesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DurationClientQueries to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DurationClientQuerie", host = "{endpoint}")
    public interface QueriesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint, @QueryParam("input") Duration input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/iso8601",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> iso8601Sync(@HostParam("endpoint") String endpoint, @QueryParam("input") Duration input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/int32-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> int32SecondsSync(@HostParam("endpoint") String endpoint, @QueryParam("input") long input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/float-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> floatSecondsSync(@HostParam("endpoint") String endpoint, @QueryParam("input") double input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/float64-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> float64SecondsSync(@HostParam("endpoint") String endpoint, @QueryParam("input") double input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/query/int32-seconds-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> int32SecondsArraySync(@HostParam("endpoint") String endpoint, @QueryParam("input") String input,
            RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(Duration input, RequestOptions requestOptions) {
        return service.defaultMethodSync(this.client.getEndpoint(), input, requestOptions);
    }

    /**
     * The iso8601 operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> iso8601WithResponse(Duration input, RequestOptions requestOptions) {
        return service.iso8601Sync(this.client.getEndpoint(), input, requestOptions);
    }

    /**
     * The int32Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> int32SecondsWithResponse(Duration input, RequestOptions requestOptions) {
        long inputConverted = input.getSeconds();
        return service.int32SecondsSync(this.client.getEndpoint(), inputConverted, requestOptions);
    }

    /**
     * The floatSeconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> floatSecondsWithResponse(Duration input, RequestOptions requestOptions) {
        double inputConverted = (double) input.toNanos() / 1000_000_000L;
        return service.floatSecondsSync(this.client.getEndpoint(), inputConverted, requestOptions);
    }

    /**
     * The float64Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> float64SecondsWithResponse(Duration input, RequestOptions requestOptions) {
        double inputConverted = (double) input.toNanos() / 1000_000_000L;
        return service.float64SecondsSync(this.client.getEndpoint(), inputConverted, requestOptions);
    }

    /**
     * The int32SecondsArray operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> int32SecondsArrayWithResponse(List<Duration> input, RequestOptions requestOptions) {
        String inputConverted = input.stream()
            .map(paramItemValue -> paramItemValue.getSeconds())
            .collect(Collectors.toList())
            .stream()
            .map(paramItemValue -> {
                if (paramItemValue == null) {
                    return "";
                } else {
                    String itemValueString = BinaryData.fromObject(paramItemValue).toString();
                    int strLength = itemValueString.length();
                    int startOffset = 0;
                    while (startOffset < strLength) {
                        if (itemValueString.charAt(startOffset) != '"') {
                            break;
                        }
                        startOffset++;
                    }
                    if (startOffset == strLength) {
                        return "";
                    }
                    int endOffset = strLength - 1;
                    while (endOffset >= 0) {
                        if (itemValueString.charAt(endOffset) != '"') {
                            break;
                        }

                        endOffset--;
                    }
                    return itemValueString.substring(startOffset, endOffset + 1);
                }
            })
            .collect(Collectors.joining(","));
        return service.int32SecondsArraySync(this.client.getEndpoint(), inputConverted, requestOptions);
    }
}
