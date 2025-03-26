package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The FileWithHttpPartSpecificContentTypeRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FileWithHttpPartSpecificContentTypeRequest {
    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final FileSpecificContentType profileImage;

    /**
     * Creates an instance of FileWithHttpPartSpecificContentTypeRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public FileWithHttpPartSpecificContentTypeRequest(FileSpecificContentType profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(generated = true)
    public FileSpecificContentType getProfileImage() {
        return this.profileImage;
    }
}
