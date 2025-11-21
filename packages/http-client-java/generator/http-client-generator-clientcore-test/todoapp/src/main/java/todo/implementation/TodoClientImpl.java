package todo.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the TodoClient type.
 */
public final class TodoClientImpl {
    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * The UsersImpl object to access its operations.
     */
    private final UsersImpl users;

    /**
     * Gets the UsersImpl object to access its operations.
     * 
     * @return the UsersImpl object.
     */
    public UsersImpl getUsers() {
        return this.users;
    }

    /**
     * The TodoItemsImpl object to access its operations.
     */
    private final TodoItemsImpl todoItems;

    /**
     * Gets the TodoItemsImpl object to access its operations.
     * 
     * @return the TodoItemsImpl object.
     */
    public TodoItemsImpl getTodoItems() {
        return this.todoItems;
    }

    /**
     * The TodoItemsAttachmentsImpl object to access its operations.
     */
    private final TodoItemsAttachmentsImpl todoItemsAttachments;

    /**
     * Gets the TodoItemsAttachmentsImpl object to access its operations.
     * 
     * @return the TodoItemsAttachmentsImpl object.
     */
    public TodoItemsAttachmentsImpl getTodoItemsAttachments() {
        return this.todoItemsAttachments;
    }

    /**
     * Initializes an instance of TodoClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public TodoClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.users = new UsersImpl(this);
        this.todoItems = new TodoItemsImpl(this);
        this.todoItemsAttachments = new TodoItemsAttachmentsImpl(this);
    }
}
