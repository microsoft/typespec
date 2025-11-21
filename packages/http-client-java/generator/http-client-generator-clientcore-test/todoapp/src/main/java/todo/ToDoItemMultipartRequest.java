package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import java.util.List;

/**
 * The ToDoItemMultipartRequest model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class ToDoItemMultipartRequest {
    /*
     * The item property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final CreateFormRequestItem item;

    /*
     * The attachments property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<FileDetails> attachments;

    /**
     * Creates an instance of ToDoItemMultipartRequest class.
     * 
     * @param item the item value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ToDoItemMultipartRequest(CreateFormRequestItem item) {
        this.item = item;
    }

    /**
     * Get the item property: The item property.
     * 
     * @return the item value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem getItem() {
        return this.item;
    }

    /**
     * Get the attachments property: The attachments property.
     * 
     * @return the attachments value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<FileDetails> getAttachments() {
        return this.attachments;
    }

    /**
     * Set the attachments property: The attachments property.
     * 
     * @param attachments the attachments value to set.
     * @return the ToDoItemMultipartRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ToDoItemMultipartRequest setAttachments(List<FileDetails> attachments) {
        this.attachments = attachments;
        return this;
    }
}
