package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * The file details for the "profileImage" field.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class FileOptionalContentType {
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
    private String contentType = "application/octet-stream";

    /**
     * Creates an instance of FileOptionalContentType class.
     * 
     * @param content the content value to set.
     * @param filename the filename value to set.
     */
    @Metadata(generated = true)
    public FileOptionalContentType(BinaryData content, String filename) {
        this.content = content;
        this.filename = filename;
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

    /**
     * Set the contentType property: The content-type of the file.
     * 
     * @param contentType the contentType value to set.
     * @return the FileOptionalContentType object itself.
     */
    @Metadata(generated = true)
    public FileOptionalContentType setContentType(String contentType) {
        this.contentType = contentType;
        return this;
    }
}
