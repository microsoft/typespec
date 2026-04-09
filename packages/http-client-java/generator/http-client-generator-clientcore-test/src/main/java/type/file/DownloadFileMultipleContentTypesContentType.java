package type.file;

/**
 * Defines values for DownloadFileMultipleContentTypesContentType.
 */
public enum DownloadFileMultipleContentTypesContentType {
    /**
     * Enum value image/png.
     */
    IMAGE_PNG("image/png"),

    /**
     * Enum value image/jpeg.
     */
    IMAGE_JPEG("image/jpeg");

    /**
     * The actual serialized value for a DownloadFileMultipleContentTypesContentType instance.
     */
    private final String value;

    DownloadFileMultipleContentTypesContentType(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a DownloadFileMultipleContentTypesContentType instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed DownloadFileMultipleContentTypesContentType object, or null if unable to parse.
     */
    public static DownloadFileMultipleContentTypesContentType fromString(String value) {
        if (value == null) {
            return null;
        }
        DownloadFileMultipleContentTypesContentType[] items = DownloadFileMultipleContentTypesContentType.values();
        for (DownloadFileMultipleContentTypesContentType item : items) {
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
