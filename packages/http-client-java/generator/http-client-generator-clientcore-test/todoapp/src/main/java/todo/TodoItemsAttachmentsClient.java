package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.Response;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.instrumentation.Instrumentation;
import todo.implementation.TodoItemsAttachmentsImpl;

/**
 * Initializes a new instance of the synchronous TodoClient type.
 */
@ServiceClient(builder = TodoClientBuilder.class)
public final class TodoItemsAttachmentsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final TodoItemsAttachmentsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of TodoItemsAttachmentsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    TodoItemsAttachmentsClient(TodoItemsAttachmentsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId) {
        return list(itemId, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoAttachment> list(long itemId, RequestContext requestContext) {
        return this.serviceClient.list(itemId, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> createJsonAttachmentWithResponse(long itemId, TodoAttachment contents,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.createJsonAttachment",
            requestContext,
            updatedContext -> this.serviceClient.createJsonAttachmentWithResponse(itemId, contents, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void createJsonAttachment(long itemId, TodoAttachment contents) {
        createJsonAttachmentWithResponse(itemId, contents, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> createFileAttachmentWithResponse(long itemId, FileAttachmentMultipartRequest body,
        RequestContext requestContext) {
        // Operation 'createFileAttachment' is of content-type 'multipart/form-data'. Protocol API is not usable and
        // hence not generated.
        return this.instrumentation.instrumentWithResponse("Todo.TodoItems.Attachments.createFileAttachment",
            requestContext,
            updatedContext -> this.serviceClient.createFileAttachmentWithResponse(itemId, body, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void createFileAttachment(long itemId, FileAttachmentMultipartRequest body) {
        createFileAttachmentWithResponse(itemId, body, RequestContext.none());
    }
}
