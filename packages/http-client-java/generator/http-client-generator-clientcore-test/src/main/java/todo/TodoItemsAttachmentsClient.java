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
import todo.implementation.MultipartFormDataHelper;
import todo.implementation.TodoItemsAttachmentsImpl;

/**
 * Initializes a new instance of the synchronous TodoClient type.
 */
@ServiceClient(builder = TodoClientBuilder.class)
public final class TodoItemsAttachmentsClient {
    @Metadata(generated = true)
    private final TodoItemsAttachmentsImpl serviceClient;

    /**
     * Initializes an instance of TodoItemsAttachmentsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    TodoItemsAttachmentsClient(TodoItemsAttachmentsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The list operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     items (Required): [
     *          (Required){
     *             filename: String (Required)
     *             mediaType: String (Required)
     *             contents: byte[] (Required)
     *         }
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param itemId The itemId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId, RequestOptions requestOptions) {
        return this.serviceClient.list(itemId, requestOptions);
    }

    /**
     * The createJsonAttachment operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     filename: String (Required)
     *     mediaType: String (Required)
     *     contents: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * @param itemId The itemId parameter.
     * @param contents The contents parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> createJsonAttachmentWithResponse(long itemId, BinaryData contents,
        RequestOptions requestOptions) {
        return this.serviceClient.createJsonAttachmentWithResponse(itemId, contents, requestOptions);
    }

    /**
     * The createFileAttachment operation.
     * 
     * @param itemId The itemId parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    Response<Void> createFileAttachmentWithResponse(long itemId, BinaryData body, RequestOptions requestOptions) {
        // Operation 'createFileAttachment' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.serviceClient.createFileAttachmentWithResponse(itemId, body, requestOptions);
    }

    /**
     * The list operation.
     * 
     * @param itemId The itemId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId) {
        // Generated convenience method for list
        RequestOptions requestOptions = new RequestOptions();
        return serviceClient.list(itemId, requestOptions);
    }

    /**
     * The createJsonAttachment operation.
     * 
     * @param itemId The itemId parameter.
     * @param contents The contents parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void createJsonAttachment(long itemId, TodoAttachment contents) {
        // Generated convenience method for createJsonAttachmentWithResponse
        RequestOptions requestOptions = new RequestOptions();
        createJsonAttachmentWithResponse(itemId, BinaryData.fromObject(contents), requestOptions).getValue();
    }

    /**
     * The createFileAttachment operation.
     * 
     * @param itemId The itemId parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void createFileAttachment(long itemId, FileAttachmentMultipartRequest body) {
        // Generated convenience method for createFileAttachmentWithResponse
        RequestOptions requestOptions = new RequestOptions();
        createFileAttachmentWithResponse(itemId,
            new MultipartFormDataHelper(requestOptions).serializeFileField("contents", body.getContents().getContent(),
                body.getContents().getContentType(), body.getContents().getFilename()).end().getRequestBody(),
            requestOptions).getValue();
    }
}
