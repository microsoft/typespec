package encode.duration.implementation;

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
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Headers.
 */
public final class HeadersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final HeadersService service;

    /**
     * The service client containing this operation class.
     */
    private final DurationClientImpl client;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(DurationClientImpl client) {
        this.service = RestProxy.create(HeadersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DurationClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DurationClientHeader", host = "{endpoint}")
    public interface HeadersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("duration") Duration duration, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/iso8601",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> iso8601Sync(@HostParam("endpoint") String endpoint, @HeaderParam("duration") Duration duration,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/iso8601-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> iso8601ArraySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("duration") String duration, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/int32-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> int32SecondsSync(@HostParam("endpoint") String endpoint, @HeaderParam("duration") long duration,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/float-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> floatSecondsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("duration") double duration, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/float64-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> float64SecondsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("duration") double duration, RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(Duration duration, RequestOptions requestOptions) {
        return service.defaultMethodSync(this.client.getEndpoint(), duration, requestOptions);
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> iso8601WithResponse(Duration duration, RequestOptions requestOptions) {
        return service.iso8601Sync(this.client.getEndpoint(), duration, requestOptions);
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> iso8601ArrayWithResponse(List<Duration> duration, RequestOptions requestOptions) {
        String durationConverted = duration.stream().map(paramItemValue -> {
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
        }).collect(Collectors.joining(","));
        return service.iso8601ArraySync(this.client.getEndpoint(), durationConverted, requestOptions);
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> int32SecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        long durationConverted = duration.getSeconds();
        return service.int32SecondsSync(this.client.getEndpoint(), durationConverted, requestOptions);
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> floatSecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        double durationConverted = (double) duration.toNanos() / 1000_000_000L;
        return service.floatSecondsSync(this.client.getEndpoint(), durationConverted, requestOptions);
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> float64SecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        double durationConverted = (double) duration.toNanos() / 1000_000_000L;
        return service.float64SecondsSync(this.client.getEndpoint(), durationConverted, requestOptions);
    }
}
