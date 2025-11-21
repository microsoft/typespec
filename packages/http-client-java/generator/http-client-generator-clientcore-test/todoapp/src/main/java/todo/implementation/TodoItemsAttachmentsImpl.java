package todo.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.Response;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import java.lang.reflect.InvocationTargetException;
import todo.FileAttachmentMultipartRequest;
import todo.Standard4XXResponse;
import todo.Standard5XXResponse;
import todo.TodoAttachment;
import todo.todoitems.NotFoundErrorResponse;
import todo.todoitems.implementation.PageTodoAttachment;

/**
 * An instance of this class provides access to all the operations defined in TodoItemsAttachments.
 */
public final class TodoItemsAttachmentsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final TodoItemsAttachmentsService service;

    /**
     * The service client containing this operation class.
     */
    private final TodoClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TodoItemsAttachmentsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    TodoItemsAttachmentsImpl(TodoClientImpl client) {
        this.service = TodoItemsAttachmentsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for TodoClientTodoItemsAttachments to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "TodoClientTodoItemsAttachments", host = "{endpoint}")
    public interface TodoItemsAttachmentsService {
        static TodoItemsAttachmentsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("todo.implementation.TodoItemsAttachmentsServiceImpl");
                return (TodoItemsAttachmentsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/items/{itemId}/attachments",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599 },
            exceptionBodyClass = Standard5XXResponse.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499 },
            exceptionBodyClass = Standard4XXResponse.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundErrorResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<PageTodoAttachment> list(@HostParam("endpoint") String endpoint, @PathParam("itemId") long itemId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/items/{itemId}/attachments",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599 },
            exceptionBodyClass = Standard5XXResponse.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499 },
            exceptionBodyClass = Standard4XXResponse.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundErrorResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> createJsonAttachment(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @PathParam("itemId") long itemId,
            @BodyParam("application/json") TodoAttachment contents, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/items/{itemId}/attachments",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599 },
            exceptionBodyClass = Standard5XXResponse.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                405,
                406,
                407,
                408,
                409,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                422,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499 },
            exceptionBodyClass = Standard4XXResponse.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundErrorResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<Void> createFileAttachment(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @PathParam("itemId") long itemId,
            @BodyParam("multipart/form-data") FileAttachmentMultipartRequest body, RequestContext requestContext);
    }

    /**
     * The list operation.
     * 
     * @param itemId The itemId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoAttachment> listSinglePage(long itemId) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.list", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<PageTodoAttachment> res
                    = service.list(this.client.getEndpoint(), itemId, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getItems(), null, null, null, null, null);
            });
    }

    /**
     * The list operation.
     * 
     * @param itemId The itemId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoAttachment> listSinglePage(long itemId, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.list", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<PageTodoAttachment> res
                    = service.list(this.client.getEndpoint(), itemId, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getItems(), null, null, null, null, null);
            });
    }

    /**
     * The list operation.
     * 
     * @param itemId The itemId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listSinglePage(itemId);
        });
    }

    /**
     * The list operation.
     * 
     * @param itemId The itemId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "list")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listSinglePage(itemId, requestContext);
        });
    }

    /**
     * The createJsonAttachment operation.
     * 
     * @param itemId The itemId parameter.
     * @param contents The contents parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> createJsonAttachmentWithResponse(long itemId, TodoAttachment contents,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.createJsonAttachment",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.createJsonAttachment(this.client.getEndpoint(), contentType, itemId, contents,
                    updatedContext);
            });
    }

    /**
     * The createFileAttachment operation.
     * 
     * @param itemId The itemId parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> createFileAttachmentWithResponse(long itemId, FileAttachmentMultipartRequest body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.createFileAttachment",
            requestContext, updatedContext -> {
                final String contentType = "multipart/form-data";
                return service.createFileAttachment(this.client.getEndpoint(), contentType, itemId, body,
                    updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(TodoItemsAttachmentsImpl.class);
}
