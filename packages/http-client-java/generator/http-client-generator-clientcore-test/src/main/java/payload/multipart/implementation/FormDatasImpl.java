package payload.multipart.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
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
import java.lang.reflect.InvocationTargetException;
import payload.multipart.BinaryArrayPartsRequest;
import payload.multipart.ComplexPartsRequest;
import payload.multipart.JsonPartRequest;
import payload.multipart.MultiBinaryPartsRequest;
import payload.multipart.MultiPartRequest;
import payload.multipart.formdata.AnonymousModelRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDatas.
 */
public final class FormDatasImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDatasService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDatasImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDatasImpl(MultiPartClientImpl client) {
        this.service = FormDatasService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for MultiPartClientFormDatas to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormDatas", host = "{endpoint}")
    public interface FormDatasService {
        static FormDatasService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.multipart.implementation.FormDatasServiceImpl");
                return (FormDatasService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/mixed-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> basic(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") MultiPartRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/complex-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> fileArrayAndBasic(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") ComplexPartsRequest body,
            RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/json-part",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> jsonPart(@HostParam("endpoint") String endpoint, @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") JsonPartRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/binary-array-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> binaryArrayParts(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") BinaryArrayPartsRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/multi-binary-parts",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> multiBinaryParts(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") MultiBinaryPartsRequest body, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/check-filename-and-content-type",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> checkFileNameAndContentType(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") MultiPartRequest body,
            RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/anonymous-model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> anonymousModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") AnonymousModelRequest body, RequestContext requestContext);
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> basicWithResponse(MultiPartRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.basic", requestContext,
            updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.basic(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fileArrayAndBasicWithResponse(ComplexPartsRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.fileArrayAndBasic",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.fileArrayAndBasic(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data for scenario contains json part and binary part.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> jsonPartWithResponse(JsonPartRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.jsonPart", requestContext,
            updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.jsonPart(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> binaryArrayPartsWithResponse(BinaryArrayPartsRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.binaryArrayParts",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.binaryArrayParts(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> multiBinaryPartsWithResponse(MultiBinaryPartsRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.multiBinaryParts",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.multiBinaryParts(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> checkFileNameAndContentTypeWithResponse(MultiPartRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.checkFileNameAndContentType",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.checkFileNameAndContentType(this.client.getEndpoint(), contentType, body,
                    updatedContext);
            });
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> anonymousModelWithResponse(AnonymousModelRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.anonymousModel", requestContext,
            updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.anonymousModel(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
