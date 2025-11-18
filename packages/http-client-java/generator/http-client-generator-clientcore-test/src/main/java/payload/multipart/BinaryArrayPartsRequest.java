package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import java.util.List;

/**
 * The BinaryArrayPartsRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class BinaryArrayPartsRequest {
    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String id;

    /*
     * The pictures property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<PicturesFileDetails> pictures;

    /**
     * Creates an instance of BinaryArrayPartsRequest class.
     * 
     * @param id the id value to set.
     * @param pictures the pictures value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BinaryArrayPartsRequest(String id, List<PicturesFileDetails> pictures) {
        this.id = id;
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
     * Get the pictures property: The pictures property.
     * 
     * @return the pictures value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<PicturesFileDetails> getPictures() {
        return this.pictures;
    }
}
