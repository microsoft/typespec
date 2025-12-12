package documentation.implementation;

import documentation.lists.BulletPointsModel;
import documentation.lists.implementation.BulletPointsModelRequest;
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

/**
 * An instance of this class provides access to all the operations defined in Lists.
 */
public final class ListsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ListsService service;

    /**
     * The service client containing this operation class.
     */
    private final DocumentationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ListsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ListsImpl(DocumentationClientImpl client) {
        this.service = ListsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DocumentationClientLists to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "DocumentationClientLists", host = "{endpoint}")
    public interface ListsService {
        static ListsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("documentation.implementation.ListsServiceImpl");
                return (ListsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/documentation/lists/bullet-points/op",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> bulletPointsOp(@HostParam("endpoint") String endpoint, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/documentation/lists/bullet-points/model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> bulletPointsModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BulletPointsModelRequest bulletPointsModelRequest,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/documentation/lists/numbered",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> numbered(@HostParam("endpoint") String endpoint, RequestContext requestContext);
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsOpWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsOp", requestContext,
            updatedContext -> {
                return service.bulletPointsOp(this.client.getEndpoint(), updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsModelWithResponse(BulletPointsModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                BulletPointsModelRequest bulletPointsModelRequest = new BulletPointsModelRequest(input);
                return service.bulletPointsModel(this.client.getEndpoint(), contentType, bulletPointsModelRequest,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> numberedWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.numbered", requestContext,
            updatedContext -> {
                return service.numbered(this.client.getEndpoint(), updatedContext);
            });
    }
}
