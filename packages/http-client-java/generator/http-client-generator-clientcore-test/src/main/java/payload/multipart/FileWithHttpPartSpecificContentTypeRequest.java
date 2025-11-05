package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The FileWithHttpPartSpecificContentTypeRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FileWithHttpPartSpecificContentTypeRequest {

    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FileSpecificContentType profileImage;

    /**
     * Creates an instance of FileWithHttpPartSpecificContentTypeRequest class.
     *
     * @param profileImage the profileImage value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileWithHttpPartSpecificContentTypeRequest(FileSpecificContentType profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     *
     * @return the profileImage value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileSpecificContentType getProfileImage() {
        return this.profileImage;
    }
}
