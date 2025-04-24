package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import java.util.List;

/**
 * The BinaryArrayPartsRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class BinaryArrayPartsRequest {
    /*
     * The id property.
     */
    @Metadata(generated = true)
    private final String id;

    /*
     * The pictures property.
     */
    @Metadata(generated = true)
    private final List<PicturesFileDetails> pictures;

    /**
     * Creates an instance of BinaryArrayPartsRequest class.
     * 
     * @param id the id value to set.
     * @param pictures the pictures value to set.
     */
    @Metadata(generated = true)
    public BinaryArrayPartsRequest(String id, List<PicturesFileDetails> pictures) {
        this.id = id;
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
     * Get the pictures property: The pictures property.
     * 
     * @return the pictures value.
     */
    @Metadata(generated = true)
    public List<PicturesFileDetails> getPictures() {
        return this.pictures;
    }
}
