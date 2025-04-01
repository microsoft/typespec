package versioning.returntypechangedfrom;

/**
 * The version of the API.
 */
public enum Versions {
    /**
     * The version v1.
     */
    V1("v1"),

    /**
     * The version v2.
     */
    V2("v2");

    /**
     * The actual serialized value for a Versions instance.
     */
    private final String value;

    Versions(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a Versions instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed Versions object, or null if unable to parse.
     */
    public static Versions fromString(String value) {
        if (value == null) {
            return null;
        }
        Versions[] items = Versions.values();
        for (Versions item : items) {
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
