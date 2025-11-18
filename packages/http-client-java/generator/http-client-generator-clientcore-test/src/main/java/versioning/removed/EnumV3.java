package versioning.removed;

/**
 * Defines values for EnumV3.
 */
public enum EnumV3 {
    /**
     * Enum value enumMemberV1.
     */
    ENUM_MEMBER_V1("enumMemberV1"),

    /**
     * Enum value enumMemberV2Preview.
     */
    ENUM_MEMBER_V2PREVIEW("enumMemberV2Preview");

    /**
     * The actual serialized value for a EnumV3 instance.
     */
    private final String value;

    EnumV3(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a EnumV3 instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed EnumV3 object, or null if unable to parse.
     */
    public static EnumV3 fromString(String value) {
        if (value == null) {
            return null;
        }
        EnumV3[] items = EnumV3.values();
        for (EnumV3 item : items) {
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
