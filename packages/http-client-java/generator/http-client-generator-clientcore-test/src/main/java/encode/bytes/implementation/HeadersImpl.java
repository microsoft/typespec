package encode.bytes.implementation;

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
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.Base64Util;
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
    private final BytesClientImpl client;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(BytesClientImpl client) {
        this.service = RestProxy.create(HeadersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for BytesClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BytesClientHeaders", host = "{endpoint}")
    public interface HeadersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64Sync(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64url",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64urlSync(@HostParam("endpoint") String endpoint, @HeaderParam("value") Base64Uri value,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64url-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64urlArraySync(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(byte[] value, RequestOptions requestOptions) {
        String valueConverted = Base64Util.encodeToString(value);
        return service.defaultMethodSync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> base64WithResponse(byte[] value, RequestOptions requestOptions) {
        String valueConverted = Base64Util.encodeToString(value);
        return service.base64Sync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> base64urlWithResponse(byte[] value, RequestOptions requestOptions) {
        Base64Uri valueConverted = Base64Uri.encode(value);
        return service.base64urlSync(this.client.getEndpoint(), valueConverted, requestOptions);
    }

    /**
     * The base64urlArray operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> base64urlArrayWithResponse(List<byte[]> value, RequestOptions requestOptions) {
        String valueConverted = value.stream()
            .map(paramItemValue -> Base64Uri.encode(paramItemValue))
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
        return service.base64urlArraySync(this.client.getEndpoint(), valueConverted, requestOptions);
    }
}
