package encode.datetime.implementation;

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
import io.clientcore.core.utils.DateTimeRfc1123;
import java.lang.reflect.InvocationTargetException;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(DatetimeClientImpl client) {
        this.service = HeadersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DatetimeClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DatetimeClientHeaders", host = "{endpoint}")
    public interface HeadersService {
        static HeadersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.datetime.implementation.HeadersServiceImpl");
                return (HeadersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethod(@HostParam("endpoint") String endpoint,
            @HeaderParam("value") DateTimeRfc1123 value, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/rfc3339",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc3339(@HostParam("endpoint") String endpoint, @HeaderParam("value") OffsetDateTime value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/rfc7231",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc7231(@HostParam("endpoint") String endpoint, @HeaderParam("value") DateTimeRfc1123 value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/unix-timestamp",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> unixTimestamp(@HostParam("endpoint") String endpoint, @HeaderParam("value") long value,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/header/unix-timestamp-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> unixTimestampArray(@HostParam("endpoint") String endpoint, @HeaderParam("value") String value,
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
    public Response<Void> defaultMethodWithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Header.default", requestContext,
            updatedContext -> {
                DateTimeRfc1123 valueConverted = new DateTimeRfc1123(value);
                return service.defaultMethod(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The rfc3339 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc3339WithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Header.rfc3339", requestContext,
            updatedContext -> {
                return service.rfc3339(this.client.getEndpoint(), value, updatedContext);
            });
    }

    /**
     * The rfc7231 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc7231WithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Header.rfc7231", requestContext,
            updatedContext -> {
                DateTimeRfc1123 valueConverted = new DateTimeRfc1123(value);
                return service.rfc7231(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> unixTimestampWithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Header.unixTimestamp", requestContext,
            updatedContext -> {
                long valueConverted = value.toEpochSecond();
                return service.unixTimestamp(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> unixTimestampArrayWithResponse(List<OffsetDateTime> value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Header.unixTimestampArray", requestContext,
            updatedContext -> {
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
                return service.unixTimestampArray(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }
}
