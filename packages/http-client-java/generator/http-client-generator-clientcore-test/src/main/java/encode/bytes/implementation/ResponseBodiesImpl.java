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

/**
 * An instance of this class provides access to all the operations defined in ResponseBodies.
 */
public final class ResponseBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ResponseBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ResponseBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ResponseBodiesImpl(BytesClientImpl client) {
        this.service = ResponseBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for BytesClientResponseBodies to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "BytesClientResponseBodies", host = "{endpoint}")
    public interface ResponseBodiesService {
        static ResponseBodiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.bytes.implementation.ResponseBodiesServiceImpl");
                return (ResponseBodiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> defaultMethod(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/octet-stream",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> octetStream(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/custom-content-type",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> customContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/base64",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<byte[]> base64(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/bytes/body/response/base64url",
            expectedStatusCodes = { 200 },
            returnValueWireType = Base64Uri.class)
        @UnexpectedResponseExceptionDetail
        Response<byte[]> base64url(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> defaultMethodWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.default", requestContext,
            updatedContext -> {
                final String accept = "application/octet-stream";
                return service.defaultMethod(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The octetStream operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> octetStreamWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.octetStream", requestContext,
            updatedContext -> {
                final String accept = "application/octet-stream";
                return service.octetStream(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The customContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> customContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.customContentType",
            requestContext, updatedContext -> {
                final String accept = "image/png";
                return service.customContentType(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The base64 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return represent a byte array along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<byte[]> base64WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.base64", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.base64(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The base64url operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<byte[]> base64urlWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.ResponseBody.base64url", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.base64url(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
