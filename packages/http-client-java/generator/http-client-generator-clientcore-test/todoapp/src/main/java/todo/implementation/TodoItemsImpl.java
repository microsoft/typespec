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
import io.clientcore.core.http.annotations.QueryParam;
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
import java.util.List;
import todo.Standard4XXResponse;
import todo.Standard5XXResponse;
import todo.ToDoItemMultipartRequest;
import todo.TodoAttachment;
import todo.TodoItem;
import todo.todoitems.InvalidTodoItem;
import todo.todoitems.NotFoundErrorResponse;
import todo.todoitems.TodoItemPatch;
import todo.todoitems.implementation.TodoPage;

/**
 * An instance of this class provides access to all the operations defined in TodoItems.
 */
public final class TodoItemsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final TodoItemsService service;

    /**
     * The service client containing this operation class.
     */
    private final TodoClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TodoItemsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    TodoItemsImpl(TodoClientImpl client) {
        this.service = TodoItemsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for TodoClientTodoItems to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "TodoClientTodoItems", host = "{endpoint}")
    public interface TodoItemsService {
        static TodoItemsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("todo.implementation.TodoItemsServiceImpl");
                return (TodoItemsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/items", expectedStatusCodes = { 200 })
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
                404,
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
        @UnexpectedResponseExceptionDetail
        Response<TodoPage> list(@HostParam("endpoint") String endpoint, @QueryParam("limit") Integer limit,
            @QueryParam("offset") Integer offset, @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/items", expectedStatusCodes = { 200 })
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
        @UnexpectedResponseExceptionDetail(statusCode = { 422 }, exceptionBodyClass = InvalidTodoItem.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                404,
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
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> createJson(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CreateJsonRequest createJsonRequest, RequestContext requestContext);

        // @Multipart not supported by RestProxy
        @HttpRequestInformation(method = HttpMethod.POST, path = "/items", expectedStatusCodes = { 200 })
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
        @UnexpectedResponseExceptionDetail(statusCode = { 422 }, exceptionBodyClass = InvalidTodoItem.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                404,
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
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> createForm(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("multipart/form-data") ToDoItemMultipartRequest body, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/items/{id}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundErrorResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> get(@HostParam("endpoint") String endpoint, @PathParam("id") long id,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/items/{id}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> update(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @PathParam("id") long id,
            @HeaderParam("Accept") String accept, @BodyParam("application/merge-patch+json") TodoItemPatch patch,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.DELETE, path = "/items/{id}", expectedStatusCodes = { 204 })
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
        Response<Void> delete(@HostParam("endpoint") String endpoint, @PathParam("id") long id,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
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
                404,
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
        @UnexpectedResponseExceptionDetail
        Response<TodoPage> listNext(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The list operation.
     * 
     * @param limit The limit to the number of items.
     * @param offset The offset to start paginating at.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoItem> listSinglePage(Integer limit, Integer offset) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.list", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<TodoPage> res = service.list(this.client.getEndpoint(), limit, offset, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getItems(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
            });
    }

    /**
     * The list operation.
     * 
     * @param limit The limit to the number of items.
     * @param offset The offset to start paginating at.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoItem> listSinglePage(Integer limit, Integer offset, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.list", requestContext, updatedContext -> {
            final String accept = "application/json";
            Response<TodoPage> res = service.list(this.client.getEndpoint(), limit, offset, accept, updatedContext);
            return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                res.getValue().getItems(), null,
                res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
        });
    }

    /**
     * The list operation.
     * 
     * @param limit The limit to the number of items.
     * @param offset The offset to start paginating at.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(Integer limit, Integer offset) {
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
            return listSinglePage(limit, offset);
        }, (pagingOptions, nextLink) -> listNextSinglePage(nextLink));
    }

    /**
     * The list operation.
     * 
     * @param limit The limit to the number of items.
     * @param offset The offset to start paginating at.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(Integer limit, Integer offset, RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
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
            return listSinglePage(limit, offset, requestContext);
        }, (pagingOptions, nextLink) -> listNextSinglePage(nextLink, requestContextForNextPage));
    }

    /**
     * The createJson operation.
     * 
     * @param item The item parameter.
     * @param attachments The attachments parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> createJsonWithResponse(TodoItem item, List<TodoAttachment> attachments,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.createJson", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                CreateJsonRequest createJsonRequest = new CreateJsonRequest(item);
                createJsonRequest.setAttachments(attachments);
                return service.createJson(this.client.getEndpoint(), contentType, accept, createJsonRequest,
                    updatedContext);
            });
    }

    /**
     * The createForm operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> createFormWithResponse(ToDoItemMultipartRequest body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.createForm", requestContext,
            updatedContext -> {
                final String contentType = "multipart/form-data";
                final String accept = "application/json";
                return service.createForm(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The get operation.
     * 
     * @param id The id parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> getWithResponse(long id, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.get", requestContext, updatedContext -> {
            final String accept = "application/json";
            return service.get(this.client.getEndpoint(), id, accept, updatedContext);
        });
    }

    /**
     * The update operation.
     * 
     * @param id The id parameter.
     * @param patch The patch parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> updateWithResponse(long id, TodoItemPatch patch, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.update", requestContext, updatedContext -> {
            final String contentType = "application/merge-patch+json";
            final String accept = "application/json";
            return service.update(this.client.getEndpoint(), contentType, id, accept, patch, updatedContext);
        });
    }

    /**
     * The delete operation.
     * 
     * @param id The id parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(long id, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.delete", requestContext, updatedContext -> {
            return service.delete(this.client.getEndpoint(), id, updatedContext);
        });
    }

    /**
     * Get the next page of items.
     * 
     * @param nextLink The URL to get the next list of items.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoItem> listNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.list", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<TodoPage> res = service.listNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getItems(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
            });
    }

    /**
     * Get the next page of items.
     * 
     * @param nextLink The URL to get the next list of items.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<TodoItem> listNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.list", requestContext, updatedContext -> {
            final String accept = "application/json";
            Response<TodoPage> res = service.listNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
            return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                res.getValue().getItems(), null,
                res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(TodoItemsImpl.class);
}
