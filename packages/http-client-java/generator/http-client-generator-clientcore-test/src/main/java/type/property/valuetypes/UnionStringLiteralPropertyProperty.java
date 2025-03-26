package type.property.valuetypes;

/**
 * Defines values for UnionStringLiteralPropertyProperty.
 */
public enum UnionStringLiteralPropertyProperty {
    /**
     * Enum value hello.
     */
    HELLO("hello"),

    /**
     * Enum value world.
     */
    WORLD("world");

    /**
     * The actual serialized value for a UnionStringLiteralPropertyProperty instance.
     */
    private final String value;

    UnionStringLiteralPropertyProperty(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a UnionStringLiteralPropertyProperty instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed UnionStringLiteralPropertyProperty object, or null if unable to parse.
     */
    public static UnionStringLiteralPropertyProperty fromString(String value) {
        if (value == null) {
            return null;
        }
        UnionStringLiteralPropertyProperty[] items = UnionStringLiteralPropertyProperty.values();
        for (UnionStringLiteralPropertyProperty item : items) {
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
