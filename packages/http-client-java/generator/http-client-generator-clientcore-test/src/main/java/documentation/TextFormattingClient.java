package documentation;

import documentation.implementation.TextFormattingsImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the synchronous DocumentationClient type.
 */
@ServiceClient(builder = DocumentationClientBuilder.class)
public final class TextFormattingClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final TextFormattingsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TextFormattingClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    TextFormattingClient(TextFormattingsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> boldTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.boldText", requestContext,
            updatedContext -> this.serviceClient.boldTextWithResponse(updatedContext));
    }

    /**
     * This is **bold text** in the middle of a sentence.
     * This is a sentence with **multiple bold** sections and **another bold** section.
     * **This entire sentence is bold.**.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void boldText() {
        boldTextWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> italicTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.italicText", requestContext,
            updatedContext -> this.serviceClient.italicTextWithResponse(updatedContext));
    }

    /**
     * This is *italic text* in the middle of a sentence.
     * This is a sentence with *multiple italic* sections and *another italic* section.
     * *This entire sentence is italic.*.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void italicText() {
        italicTextWithResponse(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> combinedFormattingWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.TextFormatting.combinedFormatting",
            requestContext, updatedContext -> this.serviceClient.combinedFormattingWithResponse(updatedContext));
    }

    /**
     * This sentence has **bold**, *italic*, and ***bold italic*** text.
     * You can also combine them like **bold with *italic inside* bold**.
     * Or *italic with **bold inside** italic*.
     * This is a sentence with **bold**, *italic*, and ***bold italic*** text.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void combinedFormatting() {
        combinedFormattingWithResponse(RequestContext.none());
    }
}
