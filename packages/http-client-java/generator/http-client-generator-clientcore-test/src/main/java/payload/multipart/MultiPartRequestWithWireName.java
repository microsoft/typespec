package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The MultiPartRequestWithWireName model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class MultiPartRequestWithWireName {
    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String identifier;

    /*
     * The profileImage property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ImageFileDetails image;

    /**
     * Creates an instance of MultiPartRequestWithWireName class.
     * 
     * @param identifier the identifier value to set.
     * @param image the image value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultiPartRequestWithWireName(String identifier, ImageFileDetails image) {
        this.identifier = identifier;
        this.image = image;
    }

    /**
     * Get the identifier property: The id property.
     * 
     * @return the identifier value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getIdentifier() {
        return this.identifier;
    }

    /**
     * Get the image property: The profileImage property.
     * 
     * @return the image value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ImageFileDetails getImage() {
        return this.image;
    }
}
