package type.file;

/**
 * Defines values for UploadFileMultipleContentTypesContentType.
 */
public enum UploadFileMultipleContentTypesContentType {
    /**
     * Enum value image/png.
     */
    IMAGE_PNG("image/png"),

    /**
     * Enum value image/jpeg.
     */
    IMAGE_JPEG("image/jpeg");

    /**
     * The actual serialized value for a UploadFileMultipleContentTypesContentType instance.
     */
    private final String value;

    UploadFileMultipleContentTypesContentType(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a UploadFileMultipleContentTypesContentType instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed UploadFileMultipleContentTypesContentType object, or null if unable to parse.
     */
    public static UploadFileMultipleContentTypesContentType fromString(String value) {
        if (value == null) {
            return null;
        }
        UploadFileMultipleContentTypesContentType[] items = UploadFileMultipleContentTypesContentType.values();
        for (UploadFileMultipleContentTypesContentType item : items) {
            if (item.toString().equalsIgnoreCase(value)) {
                return item;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return this.value;
    }
}
