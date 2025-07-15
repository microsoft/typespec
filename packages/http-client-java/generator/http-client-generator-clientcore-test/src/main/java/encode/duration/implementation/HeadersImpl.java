package encode.duration.implementation;

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
import java.lang.reflect.InvocationTargetException;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(DurationClientImpl client) {
        this.service = HeadersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DurationClientHeaders to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "DurationClientHeaders", host = "{endpoint}")
    public interface HeadersService {
        static HeadersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.duration.implementation.HeadersServiceImpl");
                return (HeadersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethod(@HostParam("endpoint") String endpoint, @HeaderParam("duration") Duration duration,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/iso8601",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> iso8601(@HostParam("endpoint") String endpoint, @HeaderParam("duration") Duration duration,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/iso8601-array",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> iso8601Array(@HostParam("endpoint") String endpoint, @HeaderParam("duration") String duration,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/int32-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> int32Seconds(@HostParam("endpoint") String endpoint, @HeaderParam("duration") long duration,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/float-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> floatSeconds(@HostParam("endpoint") String endpoint, @HeaderParam("duration") double duration,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/duration/header/float64-seconds",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> float64Seconds(@HostParam("endpoint") String endpoint, @HeaderParam("duration") double duration,
            RequestContext requestContext);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.default", requestContext,
            updatedContext -> {
                return service.defaultMethod(this.client.getEndpoint(), duration, updatedContext);
            });
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> iso8601WithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.iso8601", requestContext,
            updatedContext -> {
                return service.iso8601(this.client.getEndpoint(), duration, updatedContext);
            });
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> iso8601ArrayWithResponse(List<Duration> duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.iso8601Array", requestContext,
            updatedContext -> {
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
                return service.iso8601Array(this.client.getEndpoint(), durationConverted, updatedContext);
            });
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32SecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.int32Seconds", requestContext,
            updatedContext -> {
                long durationConverted = duration.getSeconds();
                return service.int32Seconds(this.client.getEndpoint(), durationConverted, updatedContext);
            });
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatSecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.floatSeconds", requestContext,
            updatedContext -> {
                double durationConverted = (double) duration.toNanos() / 1000_000_000L;
                return service.floatSeconds(this.client.getEndpoint(), durationConverted, updatedContext);
            });
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> float64SecondsWithResponse(Duration duration, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Header.float64Seconds", requestContext,
            updatedContext -> {
                double durationConverted = (double) duration.toNanos() / 1000_000_000L;
                return service.float64Seconds(this.client.getEndpoint(), durationConverted, updatedContext);
            });
    }
}
