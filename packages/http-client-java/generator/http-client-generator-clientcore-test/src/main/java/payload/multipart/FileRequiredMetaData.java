package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * The file details for the "profileImage" field.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FileRequiredMetaData {
    /*
     * The content of the file.
     */
    @Metadata(generated = true)
    private final BinaryData content;

    /*
     * The filename of the file.
     */
    @Metadata(generated = true)
    private final String filename;

    /*
     * The content-type of the file.
     */
    @Metadata(generated = true)
    private final String contentType;

    /**
     * Creates an instance of FileRequiredMetaData class.
     * 
     * @param content the content value to set.
     * @param filename the filename value to set.
     * @param contentType the contentType value to set.
     */
    @Metadata(generated = true)
    public FileRequiredMetaData(BinaryData content, String filename, String contentType) {
        this.content = content;
        this.filename = filename;
        this.contentType = contentType;
    }

    /**
     * Get the content property: The content of the file.
     * 
     * @return the content value.
     */
    @Metadata(generated = true)
    public BinaryData getContent() {
        return this.content;
    }

    /**
     * Get the filename property: The filename of the file.
     * 
     * @return the filename value.
     */
    @Metadata(generated = true)
    public String getFilename() {
        return this.filename;
    }

    /**
     * Get the contentType property: The content-type of the file.
     * 
     * @return the contentType value.
     */
    @Metadata(generated = true)
    public String getContentType() {
        return this.contentType;
    }
}
