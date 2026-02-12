package documentation.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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

/**
 * An instance of this class provides access to all the operations defined in TextFormattings.
 */
public final class TextFormattingsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final TextFormattingsService service;

    /**
     * The service client containing this operation class.
     */
    private final DocumentationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TextFormattingsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    TextFormattingsImpl(DocumentationClientImpl client) {
        this.service = TextFormattingsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DocumentationClientTextFormattings to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "DocumentationClientTextFormattings", host = "{endpoint}")
    public interface TextFormattingsService {
        static TextFormattingsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("documentation.implementation.TextFormattingsServiceImpl");
                return (TextFormattingsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/documentation/text-formatting/bold",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> boldText(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/documentation/text-formatting/italic",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> italicText(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/documentation/text-formatting/combined",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> combinedFormatting(@HostParam("endpoint") String endpoint, RequestContext requestContext);
    }

    /**
     * This is **bold text** in the middle of a sentence.
     * This is a sentence with **multiple bold** sections and **another bold** section.
     * **This entire sentence is bold.**.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> boldTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.boldText", requestContext,
            updatedContext -> {
                return service.boldText(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * This is *italic text* in the middle of a sentence.
     * This is a sentence with *multiple italic* sections and *another italic* section.
     * *This entire sentence is italic.*.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> italicTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.italicText", requestContext,
            updatedContext -> {
                return service.italicText(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * This sentence has **bold**, *italic*, and ***bold italic*** text.
     * You can also combine them like **bold with *italic inside* bold**.
     * Or *italic with **bold inside** italic*.
     * This is a sentence with **bold**, *italic*, and ***bold italic*** text.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> combinedFormattingWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.combinedFormatting",
            requestContext, updatedContext -> {
                return service.combinedFormatting(this.client.getEndpoint(), updatedContext);
            });
    }
}
