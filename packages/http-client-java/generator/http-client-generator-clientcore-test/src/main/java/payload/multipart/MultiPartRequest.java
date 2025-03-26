package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The MultiPartRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class MultiPartRequest {
    /*
     * The id property.
     */
    @Metadata(generated = true)
    private final String id;

    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of MultiPartRequest class.
     * 
     * @param id the id value to set.
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public MultiPartRequest(String id, ProfileImageFileDetails profileImage) {
        this.id = id;
        this.profileImage = profileImage;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Metadata(generated = true)
    public String getId() {
        return this.id;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(generated = true)
    public ProfileImageFileDetails getProfileImage() {
        return this.profileImage;
    }
}
