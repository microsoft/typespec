package payload.multipart.formdata.file;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import payload.multipart.FileDetails;

/**
 * The UploadFileSpecificContentTypeRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UploadFileSpecificContentTypeRequest {
    /*
     * The file property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FileDetails file;

    /**
     * Creates an instance of UploadFileSpecificContentTypeRequest class.
     * 
     * @param file the file value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UploadFileSpecificContentTypeRequest(FileDetails file) {
        this.file = file;
    }

    /**
     * Get the file property: The file property.
     * 
     * @return the file value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileDetails getFile() {
        return this.file;
    }
}
