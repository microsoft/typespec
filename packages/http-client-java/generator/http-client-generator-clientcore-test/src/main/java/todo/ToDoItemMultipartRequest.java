package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import java.util.List;

/**
 * The ToDoItemMultipartRequest model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class ToDoItemMultipartRequest {
    /*
     * The item property.
     */
    @Metadata(generated = true)
    private final TodoItem item;

    /*
     * The attachments property.
     */
    @Metadata(generated = true)
    private List<FileDetails> attachments;

    /**
     * Creates an instance of ToDoItemMultipartRequest class.
     * 
     * @param item the item value to set.
     */
    @Metadata(generated = true)
    public ToDoItemMultipartRequest(TodoItem item) {
        this.item = item;
    }

    /**
     * Get the item property: The item property.
     * 
     * @return the item value.
     */
    @Metadata(generated = true)
    public TodoItem getItem() {
        return this.item;
    }

    /**
     * Get the attachments property: The attachments property.
     * 
     * @return the attachments value.
     */
    @Metadata(generated = true)
    public List<FileDetails> getAttachments() {
        return this.attachments;
    }

    /**
     * Set the attachments property: The attachments property.
     * 
     * @param attachments the attachments value to set.
     * @return the ToDoItemMultipartRequest object itself.
     */
    @Metadata(generated = true)
    public ToDoItemMultipartRequest setAttachments(List<FileDetails> attachments) {
        this.attachments = attachments;
        return this;
    }
}
