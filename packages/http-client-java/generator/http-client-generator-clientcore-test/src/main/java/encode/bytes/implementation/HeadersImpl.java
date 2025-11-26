package encode.bytes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.utils.Base64Uri;
import java.lang.reflect.InvocationTargetException;
import java.util.Base64;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(BytesClientImpl client) {
        this.service = HeadersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for BytesClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BytesClientHeaders", host = "{endpoint}")
    public interface HeadersService {
        static HeadersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.bytes.implementation.HeadersServiceImpl");
                return (HeadersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethod(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64url",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64url(@HostParam("endpoint") String endpoint, @HeaderParam("value") Base64Uri value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/header/base64url-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> base64urlArray(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
            RequestContext requestContext);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Header.default", requestContext,
            updatedContext -> {
                String valueConverted = new String(Base64.getEncoder().encode(value));
                return service.defaultMethod(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64WithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Header.base64", requestContext,
            updatedContext -> {
                String valueConverted = new String(Base64.getEncoder().encode(value));
                return service.base64(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlWithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Header.base64url", requestContext,
            updatedContext -> {
                Base64Uri valueConverted = Base64Uri.encode(value);
                return service.base64url(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64urlArray operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlArrayWithResponse(List<byte[]> value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Header.base64urlArray", requestContext,
            updatedContext -> {
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
                return service.base64urlArray(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }
}
