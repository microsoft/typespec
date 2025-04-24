package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The FileWithHttpPartOptionalContentTypeRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FileWithHttpPartOptionalContentTypeRequest {
    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final FileOptionalContentType profileImage;

    /**
     * Creates an instance of FileWithHttpPartOptionalContentTypeRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public FileWithHttpPartOptionalContentTypeRequest(FileOptionalContentType profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(generated = true)
    public FileOptionalContentType getProfileImage() {
        return this.profileImage;
    }
}
