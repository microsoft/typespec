package todo.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.PagedResponse;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.utils.Context;
import todo.Standard4XXResponse;
import todo.Standard5XXResponse;
import todo.TodoItem;
import todo.todoitems.InvalidTodoItem;
import todo.todoitems.NotFoundErrorResponse;
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
     * Initializes an instance of TodoItemsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    TodoItemsImpl(TodoClientImpl client) {
        this.service = RestProxy.create(TodoItemsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for TodoClientTodoItems to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "TodoClientTodoItems", host = "{endpoint}")
    public interface TodoItemsService {
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
        Response<TodoPage> listSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

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
        Response<TodoItem> createJsonSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData createJsonRequest, RequestOptions requestOptions);

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
        Response<TodoItem> createFormSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("multipart/form-data") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/items/{id}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(statusCode = { 404 }, exceptionBodyClass = NotFoundErrorResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> getSync(@HostParam("endpoint") String endpoint, @PathParam("id") long id,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/items/{id}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<TodoItem> updateSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @PathParam("id") long id,
            @HeaderParam("Accept") String accept, @BodyParam("application/merge-patch+json") BinaryData patch,
            RequestOptions requestOptions);

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
        Response<Void> deleteSync(@HostParam("endpoint") String endpoint, @PathParam("id") long id,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

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
        Response<TodoPage> listNextSync(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The list operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>limit</td><td>Integer</td><td>No</td><td>The limit to the number of items</td></tr>
     * <tr><td>offset</td><td>Integer</td><td>No</td><td>The offset to start paginating at</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     items (Required): [
     *          (Required){
     *             id: long (Required)
     *             title: String (Required)
     *             createdBy: long (Required)
     *             assignedTo: Long (Optional)
     *             description: String (Optional)
     *             status: String(NotStarted/InProgress/Completed) (Required)
     *             createdAt: OffsetDateTime (Required)
     *             updatedAt: OffsetDateTime (Required)
     *             completedAt: OffsetDateTime (Optional)
     *             labels: BinaryData (Optional)
     *             _dummy: String (Optional)
     *         }
     *     ]
     *     pageSize: int (Required)
     *     totalSize: int (Required)
     *     prevLink: String (Optional)
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<TodoItem> listSinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<TodoPage> res = service.listSync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getItems(), null, res.getValue().getNextLink(), null, null, null);
    }

    /**
     * The list operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>limit</td><td>Integer</td><td>No</td><td>The limit to the number of items</td></tr>
     * <tr><td>offset</td><td>Integer</td><td>No</td><td>The offset to start paginating at</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     items (Required): [
     *          (Required){
     *             id: long (Required)
     *             title: String (Required)
     *             createdBy: long (Required)
     *             assignedTo: Long (Optional)
     *             description: String (Optional)
     *             status: String(NotStarted/InProgress/Completed) (Required)
     *             createdAt: OffsetDateTime (Required)
     *             updatedAt: OffsetDateTime (Required)
     *             completedAt: OffsetDateTime (Optional)
     *             labels: BinaryData (Optional)
     *             _dummy: String (Optional)
     *         }
     *     ]
     *     pageSize: int (Required)
     *     totalSize: int (Required)
     *     prevLink: String (Optional)
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<TodoItem> list(RequestOptions requestOptions) {
        RequestOptions requestOptionsForNextPage = new RequestOptions();
        requestOptionsForNextPage.setContext(requestOptions != null && requestOptions.getContext() != null
            ? requestOptions.getContext()
            : Context.none());
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'offset' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageSize' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageIndex' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'continuationToken' in PagingOptions is not supported in API 'list'."));
            }
            return listSinglePage(requestOptions);
        }, (pagingOptions, nextLink) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'offset' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageSize' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageIndex' in PagingOptions is not supported in API 'list'."));
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'continuationToken' in PagingOptions is not supported in API 'list'."));
            }
            return listNextSinglePage(nextLink, requestOptionsForNextPage);
        });
    }

    /**
     * The createJson operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     item (Required): {
     *         id: long (Required)
     *         title: String (Required)
     *         createdBy: long (Required)
     *         assignedTo: Long (Optional)
     *         description: String (Optional)
     *         status: String(NotStarted/InProgress/Completed) (Required)
     *         createdAt: OffsetDateTime (Required)
     *         updatedAt: OffsetDateTime (Required)
     *         completedAt: OffsetDateTime (Optional)
     *         labels: BinaryData (Optional)
     *         _dummy: String (Optional)
     *     }
     *     attachments (Optional): [
     *          (Optional){
     *             filename: String (Required)
     *             mediaType: String (Required)
     *             contents: byte[] (Required)
     *         }
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     title: String (Required)
     *     createdBy: long (Required)
     *     assignedTo: Long (Optional)
     *     description: String (Optional)
     *     status: String(NotStarted/InProgress/Completed) (Required)
     *     createdAt: OffsetDateTime (Required)
     *     updatedAt: OffsetDateTime (Required)
     *     completedAt: OffsetDateTime (Optional)
     *     labels: BinaryData (Optional)
     *     _dummy: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param createJsonRequest The createJsonRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<TodoItem> createJsonWithResponse(BinaryData createJsonRequest, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.createJsonSync(this.client.getEndpoint(), contentType, accept, createJsonRequest,
            requestOptions);
    }

    /**
     * The createForm operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     title: String (Required)
     *     createdBy: long (Required)
     *     assignedTo: Long (Optional)
     *     description: String (Optional)
     *     status: String(NotStarted/InProgress/Completed) (Required)
     *     createdAt: OffsetDateTime (Required)
     *     updatedAt: OffsetDateTime (Required)
     *     completedAt: OffsetDateTime (Optional)
     *     labels: BinaryData (Optional)
     *     _dummy: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<TodoItem> createFormWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        final String accept = "application/json";
        return service.createFormSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The get operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     title: String (Required)
     *     createdBy: long (Required)
     *     assignedTo: Long (Optional)
     *     description: String (Optional)
     *     status: String(NotStarted/InProgress/Completed) (Required)
     *     createdAt: OffsetDateTime (Required)
     *     updatedAt: OffsetDateTime (Required)
     *     completedAt: OffsetDateTime (Optional)
     *     labels: BinaryData (Optional)
     *     _dummy: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<TodoItem> getWithResponse(long id, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.client.getEndpoint(), id, accept, requestOptions);
    }

    /**
     * The update operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     title: String (Optional)
     *     assignedTo: Long (Optional)
     *     description: String (Optional)
     *     status: String(NotStarted/InProgress/Completed) (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     title: String (Required)
     *     createdBy: long (Required)
     *     assignedTo: Long (Optional)
     *     description: String (Optional)
     *     status: String(NotStarted/InProgress/Completed) (Required)
     *     createdAt: OffsetDateTime (Required)
     *     updatedAt: OffsetDateTime (Required)
     *     completedAt: OffsetDateTime (Optional)
     *     labels: BinaryData (Optional)
     *     _dummy: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param patch The patch parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<TodoItem> updateWithResponse(long id, BinaryData patch, RequestOptions requestOptions) {
        final String contentType = "application/merge-patch+json";
        final String accept = "application/json";
        return service.updateSync(this.client.getEndpoint(), contentType, id, accept, patch, requestOptions);
    }

    /**
     * The delete operation.
     * 
     * @param id The id parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> deleteWithResponse(long id, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.deleteSync(this.client.getEndpoint(), id, accept, requestOptions);
    }

    /**
     * Get the next page of items.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     items (Required): [
     *          (Required){
     *             id: long (Required)
     *             title: String (Required)
     *             createdBy: long (Required)
     *             assignedTo: Long (Optional)
     *             description: String (Optional)
     *             status: String(NotStarted/InProgress/Completed) (Required)
     *             createdAt: OffsetDateTime (Required)
     *             updatedAt: OffsetDateTime (Required)
     *             completedAt: OffsetDateTime (Optional)
     *             labels: BinaryData (Optional)
     *             _dummy: String (Optional)
     *         }
     *     ]
     *     pageSize: int (Required)
     *     totalSize: int (Required)
     *     prevLink: String (Optional)
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param nextLink The URL to get the next list of items.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<TodoItem> listNextSinglePage(String nextLink, RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<TodoPage> res = service.listNextSync(nextLink, this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getItems(), null, res.getValue().getNextLink(), null, null, null);
    }

    private static final ClientLogger LOGGER = new ClientLogger(TodoItemsImpl.class);
}
