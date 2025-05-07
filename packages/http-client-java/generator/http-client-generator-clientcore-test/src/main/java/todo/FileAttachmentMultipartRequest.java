package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The FileAttachmentMultipartRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FileAttachmentMultipartRequest {
    /*
     * The contents property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FileDetails contents;

    /**
     * Creates an instance of FileAttachmentMultipartRequest class.
     * 
     * @param contents the contents value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileAttachmentMultipartRequest(FileDetails contents) {
        this.contents = contents;
    }

    /**
     * Get the contents property: The contents property.
     * 
     * @return the contents value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileDetails getContents() {
        return this.contents;
    }
}
