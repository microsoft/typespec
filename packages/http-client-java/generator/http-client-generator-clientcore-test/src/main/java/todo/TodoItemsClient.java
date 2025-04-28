package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.util.List;
import java.util.stream.Collectors;
import todo.implementation.CreateJsonRequest;
import todo.implementation.JsonMergePatchHelper;
import todo.implementation.MultipartFormDataHelper;
import todo.implementation.TodoItemsImpl;
import todo.todoitems.TodoItemPatch;

/**
 * Initializes a new instance of the synchronous TodoClient type.
 */
@ServiceClient(builder = TodoClientBuilder.class)
public final class TodoItemsClient {
    @Metadata(generated = true)
    private final TodoItemsImpl serviceClient;

    /**
     * Initializes an instance of TodoItemsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    TodoItemsClient(TodoItemsImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(RequestOptions requestOptions) {
        return this.serviceClient.list(requestOptions);
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
    @Metadata(generated = true)
    public Response<TodoItem> createJsonWithResponse(BinaryData createJsonRequest, RequestOptions requestOptions) {
        return this.serviceClient.createJsonWithResponse(createJsonRequest, requestOptions);
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
    @Metadata(generated = true)
    Response<TodoItem> createFormWithResponse(BinaryData body, RequestOptions requestOptions) {
        // Operation 'createForm' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.serviceClient.createFormWithResponse(body, requestOptions);
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
    @Metadata(generated = true)
    public Response<TodoItem> getWithResponse(long id, RequestOptions requestOptions) {
        return this.serviceClient.getWithResponse(id, requestOptions);
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
    @Metadata(generated = true)
    public Response<TodoItem> updateWithResponse(long id, BinaryData patch, RequestOptions requestOptions) {
        return this.serviceClient.updateWithResponse(id, patch, requestOptions);
    }

    /**
     * The delete operation.
     * 
     * @param id The id parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> deleteWithResponse(long id, RequestOptions requestOptions) {
        return this.serviceClient.deleteWithResponse(id, requestOptions);
    }

    /**
     * The list operation.
     * 
     * @param limit The limit to the number of items.
     * @param offset The offset to start paginating at.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(Integer limit, Integer offset) {
        // Generated convenience method for list
        RequestOptions requestOptions = new RequestOptions();
        if (limit != null) {
            requestOptions.addQueryParam("limit", String.valueOf(limit));
        }
        if (offset != null) {
            requestOptions.addQueryParam("offset", String.valueOf(offset));
        }
        return serviceClient.list(requestOptions);
    }

    /**
     * The list operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list() {
        // Generated convenience method for list
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.list(requestOptions);
    }

    /**
     * The createJson operation.
     * 
     * @param item The item parameter.
     * @param attachments The attachments parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TodoItem createJson(TodoItem item, List<TodoAttachment> attachments) {
        // Generated convenience method for createJsonWithResponse
        RequestOptions requestOptions = new RequestOptions();
        CreateJsonRequest createJsonRequestObj = new CreateJsonRequest(item).setAttachments(attachments);
        BinaryData createJsonRequest = BinaryData.fromObject(createJsonRequestObj);
        return createJsonWithResponse(createJsonRequest, requestOptions).getValue();
    }

    /**
     * The createJson operation.
     * 
     * @param item The item parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TodoItem createJson(TodoItem item) {
        // Generated convenience method for createJsonWithResponse
        RequestOptions requestOptions = new RequestOptions();
        CreateJsonRequest createJsonRequestObj = new CreateJsonRequest(item);
        BinaryData createJsonRequest = BinaryData.fromObject(createJsonRequestObj);
        return createJsonWithResponse(createJsonRequest, requestOptions).getValue();
    }

    /**
     * The createForm operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TodoItem createForm(ToDoItemMultipartRequest body) {
        // Generated convenience method for createFormWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createFormWithResponse(
            new MultipartFormDataHelper(requestOptions).serializeJsonField("item", body.getItem())
                .serializeFileFields("attachments",
                    body.getAttachments() == null
                        ? null
                        : body.getAttachments().stream().map(FileDetails::getContent).collect(Collectors.toList()),
                    body.getAttachments() == null
                        ? null
                        : body.getAttachments().stream().map(FileDetails::getContentType).collect(Collectors.toList()),
                    body.getAttachments() == null
                        ? null
                        : body.getAttachments().stream().map(FileDetails::getFilename).collect(Collectors.toList()))
                .end()
                .getRequestBody(),
            requestOptions).getValue();
    }

    /**
     * The get operation.
     * 
     * @param id The id parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TodoItem get(long id) {
        // Generated convenience method for getWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWithResponse(id, requestOptions).getValue();
    }

    /**
     * The update operation.
     * 
     * @param id The id parameter.
     * @param patch The patch parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public TodoItem update(long id, TodoItemPatch patch) {
        // Generated convenience method for updateWithResponse
        RequestOptions requestOptions = new RequestOptions();
        JsonMergePatchHelper.getTodoItemPatchAccessor().prepareModelForJsonMergePatch(patch, true);
        BinaryData patchInBinaryData = BinaryData.fromObject(patch);
        // BinaryData.fromObject() will not fire serialization, use getLength() to fire serialization.
        patchInBinaryData.getLength();
        JsonMergePatchHelper.getTodoItemPatchAccessor().prepareModelForJsonMergePatch(patch, false);
        return updateWithResponse(id, patchInBinaryData, requestOptions).getValue();
    }

    /**
     * The delete operation.
     * 
     * @param id The id parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void delete(long id) {
        // Generated convenience method for deleteWithResponse
        RequestOptions requestOptions = new RequestOptions();
        deleteWithResponse(id, requestOptions).getValue();
    }
}
