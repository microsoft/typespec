package payload.multipart.formdata.file;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The UploadFileRequiredFilenameRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UploadFileRequiredFilenameRequest {
    /*
     * The file property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FileWithRequiredFilename file;

    /**
     * Creates an instance of UploadFileRequiredFilenameRequest class.
     * 
     * @param file the file value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UploadFileRequiredFilenameRequest(FileWithRequiredFilename file) {
        this.file = file;
    }

    /**
     * Get the file property: The file property.
     * 
     * @return the file value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileWithRequiredFilename getFile() {
        return this.file;
    }
}
