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
import payload.multipart.ComplexHttpPartsModelRequest;

/**
 * An instance of this class provides access to all the operations defined in FormDataHttpParts.
 */
public final class FormDataHttpPartsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataHttpPartsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsImpl(MultiPartClientImpl client) {
        this.service = FormDataHttpPartsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for MultiPartClientFormDataHttpParts to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormDataHttpParts", host = "{endpoint}")
    public interface FormDataHttpPartsService {
        static FormDataHttpPartsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.multipart.implementation.FormDataHttpPartsServiceImpl");
                return (FormDataHttpPartsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/complex-parts-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> jsonArrayAndFileArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType,
            @BodyParam("multipart/form-data") ComplexHttpPartsModelRequest body, RequestContext requestContext);
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
    public Response<Void> jsonArrayAndFileArrayWithResponse(ComplexHttpPartsModelRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.HttpParts.jsonArrayAndFileArray",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.jsonArrayAndFileArray(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
