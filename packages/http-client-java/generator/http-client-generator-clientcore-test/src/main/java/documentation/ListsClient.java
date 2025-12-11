package documentation;

import documentation.implementation.ListsImpl;
import documentation.lists.BulletPointsModel;
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
public final class ListsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ListsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ListsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ListsClient(ListsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * This tests:
     * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet
     * points within documentation comments. It should properly indent the wrapped lines.
     * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting
     * is preserved when the text wraps onto multiple lines in the generated documentation.
     * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the
     * wrapping and formatting are correctly applied in the output.
     * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic
     * formatting and is long enough to test the wrapping behavior in such cases.
     * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how
     * the bold formatting is maintained across wrapped lines.
     * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that
     * italic formatting is correctly applied even when the text spans multiple lines.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsOpWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsOp", requestContext,
            updatedContext -> this.serviceClient.bulletPointsOpWithResponse(updatedContext));
    }

    /**
     * This tests:
     * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet
     * points within documentation comments. It should properly indent the wrapped lines.
     * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting
     * is preserved when the text wraps onto multiple lines in the generated documentation.
     * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the
     * wrapping and formatting are correctly applied in the output.
     * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic
     * formatting and is long enough to test the wrapping behavior in such cases.
     * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how
     * the bold formatting is maintained across wrapped lines.
     * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that
     * italic formatting is correctly applied even when the text spans multiple lines.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void bulletPointsOp() {
        bulletPointsOpWithResponse(RequestContext.none());
    }

    /**
     * The bulletPointsModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsModelWithResponse(BulletPointsModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsModel", requestContext,
            updatedContext -> this.serviceClient.bulletPointsModelWithResponse(input, updatedContext));
    }

    /**
     * The bulletPointsModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void bulletPointsModel(BulletPointsModel input) {
        bulletPointsModelWithResponse(input, RequestContext.none());
    }

    /**
     * Steps to follow:
     * 1. First step with **important** note
     * 2. Second step with *emphasis*
     * 3. Third step combining **bold** and *italic*
     * 4. **Final step**: Review all steps for *accuracy*.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> numberedWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.numbered", requestContext,
            updatedContext -> this.serviceClient.numberedWithResponse(updatedContext));
    }

    /**
     * Steps to follow:
     * 1. First step with **important** note
     * 2. Second step with *emphasis*
     * 3. Third step combining **bold** and *italic*
     * 4. **Final step**: Review all steps for *accuracy*.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void numbered() {
        numberedWithResponse(RequestContext.none());
    }
}
