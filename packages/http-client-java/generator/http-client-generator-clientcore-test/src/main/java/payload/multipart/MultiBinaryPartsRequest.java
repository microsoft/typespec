package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The MultiBinaryPartsRequest model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class MultiBinaryPartsRequest {
    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProfileImageFileDetails profileImage;

    /*
     * The picture property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PictureFileDetails picture;

    /**
     * Creates an instance of MultiBinaryPartsRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiBinaryPartsRequest(ProfileImageFileDetails profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ProfileImageFileDetails getProfileImage() {
        return this.profileImage;
    }

    /**
     * Get the picture property: The picture property.
     * 
     * @return the picture value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PictureFileDetails getPicture() {
        return this.picture;
    }

    /**
     * Set the picture property: The picture property.
     * 
     * @param picture the picture value to set.
     * @return the MultiBinaryPartsRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiBinaryPartsRequest setPicture(PictureFileDetails picture) {
        this.picture = picture;
        return this;
    }
}
