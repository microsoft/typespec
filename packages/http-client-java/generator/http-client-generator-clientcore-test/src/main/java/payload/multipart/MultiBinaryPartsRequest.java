package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The MultiBinaryPartsRequest model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class MultiBinaryPartsRequest {
    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final ProfileImageFileDetails profileImage;

    /*
     * The picture property.
     */
    @Metadata(generated = true)
    private PictureFileDetails picture;

    /**
     * Creates an instance of MultiBinaryPartsRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public MultiBinaryPartsRequest(ProfileImageFileDetails profileImage) {
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

    /**
     * Get the picture property: The picture property.
     * 
     * @return the picture value.
     */
    @Metadata(generated = true)
    public PictureFileDetails getPicture() {
        return this.picture;
    }

    /**
     * Set the picture property: The picture property.
     * 
     * @param picture the picture value to set.
     * @return the MultiBinaryPartsRequest object itself.
     */
    @Metadata(generated = true)
    public MultiBinaryPartsRequest setPicture(PictureFileDetails picture) {
        this.picture = picture;
        return this;
    }
}
