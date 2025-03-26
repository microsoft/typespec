package payload.multipart.formdata;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import payload.multipart.ProfileImageFileDetails;

/**
 * The AnonymousModelRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class AnonymousModelRequest {
    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of AnonymousModelRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public AnonymousModelRequest(ProfileImageFileDetails profileImage) {
        this.profileImage = profileImage;
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
