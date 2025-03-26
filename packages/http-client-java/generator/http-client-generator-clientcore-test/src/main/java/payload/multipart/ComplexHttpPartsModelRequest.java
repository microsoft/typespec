package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import java.util.List;

/**
 * The ComplexHttpPartsModelRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ComplexHttpPartsModelRequest {
    /*
     * The id property.
     */
    @Metadata(generated = true)
    private final String id;

    /*
     * The address property.
     */
    @Metadata(generated = true)
    private final Address address;

    /*
     * The profileImage property.
     */
    @Metadata(generated = true)
    private final FileRequiredMetaData profileImage;

    /*
     * The previousAddresses property.
     */
    @Metadata(generated = true)
    private final List<Address> previousAddresses;

    /*
     * The pictures property.
     */
    @Metadata(generated = true)
    private final List<FileRequiredMetaData> pictures;

    /**
     * Creates an instance of ComplexHttpPartsModelRequest class.
     * 
     * @param id the id value to set.
     * @param address the address value to set.
     * @param profileImage the profileImage value to set.
     * @param previousAddresses the previousAddresses value to set.
     * @param pictures the pictures value to set.
     */
    @Metadata(generated = true)
    public ComplexHttpPartsModelRequest(String id, Address address, FileRequiredMetaData profileImage,
        List<Address> previousAddresses, List<FileRequiredMetaData> pictures) {
        this.id = id;
        this.address = address;
        this.profileImage = profileImage;
        this.previousAddresses = previousAddresses;
        this.pictures = pictures;
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
    public FileRequiredMetaData getProfileImage() {
        return this.profileImage;
    }

    /**
     * Get the previousAddresses property: The previousAddresses property.
     * 
     * @return the previousAddresses value.
     */
    @Metadata(generated = true)
    public List<Address> getPreviousAddresses() {
        return this.previousAddresses;
    }

    /**
     * Get the pictures property: The pictures property.
     * 
     * @return the pictures value.
     */
    @Metadata(generated = true)
    public List<FileRequiredMetaData> getPictures() {
        return this.pictures;
    }
}
