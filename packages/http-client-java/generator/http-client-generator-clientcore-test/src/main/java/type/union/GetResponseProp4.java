package type.union;

/**
 * Defines values for GetResponseProp4.
 */
public enum GetResponseProp4 {
    /**
     * Enum value a.
     */
    A("a"),

    /**
     * Enum value b.
     */
    B("b"),

    /**
     * Enum value c.
     */
    C("c");

    /**
     * The actual serialized value for a GetResponseProp4 instance.
     */
    private final String value;

    GetResponseProp4(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a GetResponseProp4 instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed GetResponseProp4 object, or null if unable to parse.
     */
    public static GetResponseProp4 fromString(String value) {
        if (value == null) {
            return null;
        }
        GetResponseProp4[] items = GetResponseProp4.values();
        for (GetResponseProp4 item : items) {
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
