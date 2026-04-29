package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The MultiPartOptionalRequest model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class MultiPartOptionalRequest {
    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String id;

    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of MultiPartOptionalRequest class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiPartOptionalRequest() {
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
     * Set the id property: The id property.
     * 
     * @param id the id value to set.
     * @return the MultiPartOptionalRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiPartOptionalRequest setId(String id) {
        this.id = id;
        return this;
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
     * Set the profileImage property: The profileImage property.
     * 
     * @param profileImage the profileImage value to set.
     * @return the MultiPartOptionalRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiPartOptionalRequest setProfileImage(ProfileImageFileDetails profileImage) {
        this.profileImage = profileImage;
        return this;
    }
}
