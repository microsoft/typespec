package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The FileWithHttpPartRequiredContentTypeRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FileWithHttpPartRequiredContentTypeRequest {
    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FileRequiredMetaData profileImage;

    /**
     * Creates an instance of FileWithHttpPartRequiredContentTypeRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileWithHttpPartRequiredContentTypeRequest(FileRequiredMetaData profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FileRequiredMetaData getProfileImage() {
        return this.profileImage;
    }
}
