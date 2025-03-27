package versioning.renamedfrom;

/**
 * Defines values for NewEnum.
 */
public enum NewEnum {
    /**
     * Enum value newEnumMember.
     */
    NEW_ENUM_MEMBER("newEnumMember");

    /**
     * The actual serialized value for a NewEnum instance.
     */
    private final String value;

    NewEnum(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a NewEnum instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed NewEnum object, or null if unable to parse.
     */
    public static NewEnum fromString(String value) {
        if (value == null) {
            return null;
        }
        NewEnum[] items = NewEnum.values();
        for (NewEnum item : items) {
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
