package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import java.util.List;

/**
 * The ComplexPartsRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ComplexPartsRequest {

    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String id;

    /*
     * The address property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Address address;

    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProfileImageFileDetails profileImage;

    /*
     * The pictures property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<PicturesFileDetails> pictures;

    /**
     * Creates an instance of ComplexPartsRequest class.
     *
     * @param id the id value to set.
     * @param address the address value to set.
     * @param profileImage the profileImage value to set.
     * @param pictures the pictures value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ComplexPartsRequest(String id, Address address, ProfileImageFileDetails profileImage,
        List<PicturesFileDetails> pictures) {
        this.id = id;
        this.address = address;
        this.profileImage = profileImage;
        this.pictures = pictures;
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
     * Get the address property: The address property.
     *
     * @return the address value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Address getAddress() {
        return this.address;
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
     * Get the pictures property: The pictures property.
     *
     * @return the pictures value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<PicturesFileDetails> getPictures() {
        return this.pictures;
    }
}
