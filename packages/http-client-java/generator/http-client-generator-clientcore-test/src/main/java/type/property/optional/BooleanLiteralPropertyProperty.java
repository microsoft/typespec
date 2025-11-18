package type.property.optional;

/**
 * Defines values for BooleanLiteralPropertyProperty.
 */
public enum BooleanLiteralPropertyProperty {
    /**
     * Enum value true.
     */
    TRUE(true);

    /**
     * The actual serialized value for a BooleanLiteralPropertyProperty instance.
     */
    private final boolean value;

    BooleanLiteralPropertyProperty(boolean value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a BooleanLiteralPropertyProperty instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed BooleanLiteralPropertyProperty object, or null if unable to parse.
     */
    public static BooleanLiteralPropertyProperty fromBoolean(boolean value) {
        BooleanLiteralPropertyProperty[] items = BooleanLiteralPropertyProperty.values();
        for (BooleanLiteralPropertyProperty item : items) {
            if (item.toBoolean() == value) {
                return item;
            }
        }
        return null;
    }

    /**
     * De-serializes the instance to boolean value.
     * 
     * @return the boolean value.
     */
    public boolean toBoolean() {
        return this.value;
    }
}
