package encode.datetime.implementation;

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
import io.clientcore.core.utils.DateTimeRfc1123;
import java.time.OffsetDateTime;
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
    private final DatetimeClientImpl client;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(DatetimeClientImpl client) {
        this.service = RestProxy.create(HeadersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DatetimeClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DatetimeClientHeader", host = "{endpoint}")
    public interface HeadersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("value") DateTimeRfc1123 value, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/rfc3339",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc3339Sync(@HostParam("endpoint") String endpoint, @HeaderParam("value") OffsetDateTime value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/rfc7231",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc7231Sync(@HostParam("endpoint") String endpoint, @HeaderParam("value") DateTimeRfc1123 value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/unix-timestamp",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> unixTimestampSync(@HostParam("endpoint") String endpoint, @HeaderParam("value") long value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/unix-timestamp-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> unixTimestampArraySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("value") String value, RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        DateTimeRfc1123 valueConverted = new DateTimeRfc1123(value);
        return service.defaultMethodSync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The rfc3339 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> rfc3339WithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        return service.rfc3339Sync(this.client.getEndpoint(), value, requestOptions);
    }

    /**
     * The rfc7231 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> rfc7231WithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        DateTimeRfc1123 valueConverted = new DateTimeRfc1123(value);
        return service.rfc7231Sync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> unixTimestampWithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        long valueConverted = value.toEpochSecond();
        return service.unixTimestampSync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> unixTimestampArrayWithResponse(List<OffsetDateTime> value, RequestOptions requestOptions) {
        String valueConverted = value.stream()
            .map(paramItemValue -> paramItemValue.toEpochSecond())
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
        return service.unixTimestampArraySync(this.client.getEndpoint(), valueConverted, requestOptions);
    }
}
