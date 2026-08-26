package payload.multipart.formdata.file;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import java.util.List;
import payload.multipart.FilesFileDetails;

/**
 * The UploadFileArrayRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UploadFileArrayRequest {
    /*
     * The files property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<FilesFileDetails> files;

    /**
     * Creates an instance of UploadFileArrayRequest class.
     * 
     * @param files the files value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UploadFileArrayRequest(List<FilesFileDetails> files) {
        this.files = files;
    }

    /**
     * Get the files property: The files property.
     * 
     * @return the files value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<FilesFileDetails> getFiles() {
        return this.files;
    }
}
