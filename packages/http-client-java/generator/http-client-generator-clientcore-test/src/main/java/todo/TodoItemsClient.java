package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import java.util.List;
import todo.implementation.TodoItemsImpl;
import todo.todoitems.TodoItemPatch;

/**
 * Initializes a new instance of the synchronous TodoClient type.
 */
@ServiceClient(builder = TodoClientBuilder.class)
public final class TodoItemsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final TodoItemsImpl serviceClient;

    /**
     * Initializes an instance of TodoItemsClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    TodoItemsClient(TodoItemsImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(Integer limit, Integer offset) {
        return this.serviceClient.list(limit, offset);
    }

    /**
     * The list operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list() {
        return this.serviceClient.list();
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
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<TodoItem> list(Integer limit, Integer offset, RequestContext requestContext) {
        return this.serviceClient.list(limit, offset, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> createJsonWithResponse(TodoItem item, List<TodoAttachment> attachments,
        RequestContext requestContext) {
        return this.serviceClient.createJsonWithResponse(item, attachments, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TodoItem createJson(TodoItem item, List<TodoAttachment> attachments) {
        return this.serviceClient.createJson(item, attachments);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TodoItem createJson(TodoItem item) {
        return this.serviceClient.createJson(item);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> createFormWithResponse(ToDoItemMultipartRequest body, RequestContext requestContext) {
        // Operation 'createForm' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.serviceClient.createFormWithResponse(body, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TodoItem createForm(ToDoItemMultipartRequest body) {
        // Operation 'createForm' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.serviceClient.createForm(body);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> getWithResponse(long id, RequestContext requestContext) {
        return this.serviceClient.getWithResponse(id, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TodoItem get(long id) {
        return this.serviceClient.get(id);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TodoItem> updateWithResponse(long id, TodoItemPatch patch, RequestContext requestContext) {
        return this.serviceClient.updateWithResponse(id, patch, requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TodoItem update(long id, TodoItemPatch patch) {
        return this.serviceClient.update(id, patch);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(long id, RequestContext requestContext) {
        return this.serviceClient.deleteWithResponse(id, requestContext);
    }

    /**
     * The delete operation.
     * 
     * @param id The id parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void delete(long id) {
        this.serviceClient.delete(id);
    }
}
