package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The FileAttachmentMultipartRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FileAttachmentMultipartRequest {
    /*
     * The contents property.
     */
    @Metadata(generated = true)
    private final FileDetails contents;

    /**
     * Creates an instance of FileAttachmentMultipartRequest class.
     * 
     * @param contents the contents value to set.
     */
    @Metadata(generated = true)
    public FileAttachmentMultipartRequest(FileDetails contents) {
        this.contents = contents;
    }

    /**
     * Get the contents property: The contents property.
     * 
     * @return the contents value.
     */
    @Metadata(generated = true)
    public FileDetails getContents() {
        return this.contents;
    }
}
