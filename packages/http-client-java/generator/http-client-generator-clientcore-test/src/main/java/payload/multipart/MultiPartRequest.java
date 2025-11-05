package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The MultiPartRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class MultiPartRequest {

    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String id;

    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of MultiPartRequest class.
     *
     * @param id the id value to set.
     * @param profileImage the profileImage value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiPartRequest(String id, ProfileImageFileDetails profileImage) {
        this.id = id;
        this.profileImage = profileImage;
    }

    /**
     * Get the id property: The id property.
     *
     * @return the id value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getId() {
        return this.id;
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
