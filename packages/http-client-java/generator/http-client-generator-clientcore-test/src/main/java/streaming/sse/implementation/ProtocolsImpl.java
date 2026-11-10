package streaming.sse.implementation;

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

/**
 * An instance of this class provides access to all the operations defined in Protocols.
 */
public final class ProtocolsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ProtocolsService service;

    /**
     * The service client containing this operation class.
     */
    private final SseClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ProtocolsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ProtocolsImpl(SseClientImpl client) {
        this.service = ProtocolsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SseClientProtocols to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "SseClientProtocols", host = "{endpoint}")
    public interface ProtocolsService {
        static ProtocolsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("streaming.sse.implementation.ProtocolsServiceImpl");
                return (ProtocolsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/sse/protocol/id",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> id(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/sse/protocol/invalid-id",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> invalidId(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/sse/protocol/retry",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> retry(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/sse/protocol/invalid-retry",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> invalidRetry(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/streaming/sse/protocol/reconnect",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> reconnect(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The id operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> idWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.id", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.id(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The invalidId operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> invalidIdWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.invalidId", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.invalidId(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The retry operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> retryWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.retry", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.retry(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The invalidRetry operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> invalidRetryWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.invalidRetry", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.invalidRetry(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The reconnect operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> reconnectWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.reconnect", requestContext,
            updatedContext -> {
                final String accept = "text/event-stream";
                return service.reconnect(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
