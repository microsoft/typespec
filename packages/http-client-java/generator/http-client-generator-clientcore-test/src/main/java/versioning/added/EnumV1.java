package versioning.added;

/**
 * Defines values for EnumV1.
 */
public enum EnumV1 {
    /**
     * Enum value enumMemberV1.
     */
    ENUM_MEMBER_V1("enumMemberV1"),

    /**
     * Enum value enumMemberV2.
     */
    ENUM_MEMBER_V2("enumMemberV2");

    /**
     * The actual serialized value for a EnumV1 instance.
     */
    private final String value;

    EnumV1(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a EnumV1 instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed EnumV1 object, or null if unable to parse.
     */
    public static EnumV1 fromString(String value) {
        if (value == null) {
            return null;
        }
        EnumV1[] items = EnumV1.values();
        for (EnumV1 item : items) {
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
