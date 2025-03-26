package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The FileWithHttpPartRequiredContentTypeRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FileWithHttpPartRequiredContentTypeRequest {
    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final FileRequiredMetaData profileImage;

    /**
     * Creates an instance of FileWithHttpPartRequiredContentTypeRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public FileWithHttpPartRequiredContentTypeRequest(FileRequiredMetaData profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(generated = true)
    public FileRequiredMetaData getProfileImage() {
        return this.profileImage;
    }
}
