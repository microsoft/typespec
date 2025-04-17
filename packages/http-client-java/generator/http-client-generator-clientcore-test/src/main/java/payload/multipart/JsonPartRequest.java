package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The JsonPartRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class JsonPartRequest {
    /*
     * The address property.
     */
    @Metadata(generated = true)
    private final Address address;

    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of JsonPartRequest class.
     * 
     * @param address the address value to set.
     * @param profileImage the profileImage value to set.
     */
    @Metadata(generated = true)
    public JsonPartRequest(Address address, ProfileImageFileDetails profileImage) {
        this.address = address;
        this.profileImage = profileImage;
    }

    /**
     * Get the address property: The address property.
     * 
     * @return the address value.
     */
    @Metadata(generated = true)
    public Address getAddress() {
        return this.address;
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
