package payload.multipart.formdata;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import payload.multipart.ProfileImageFileDetails;

/**
 * The AnonymousModelRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class AnonymousModelRequest {
    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of AnonymousModelRequest class.
     * 
     * @param profileImage the profileImage value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public AnonymousModelRequest(ProfileImageFileDetails profileImage) {
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
}
