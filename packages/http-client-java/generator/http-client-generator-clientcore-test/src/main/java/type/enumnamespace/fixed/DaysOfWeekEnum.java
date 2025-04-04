package type.enumnamespace.fixed;

/**
 * Days of the week.
 */
public enum DaysOfWeekEnum {
    /**
     * Monday.
     */
    MONDAY("Monday"),

    /**
     * Tuesday.
     */
    TUESDAY("Tuesday"),

    /**
     * Wednesday.
     */
    WEDNESDAY("Wednesday"),

    /**
     * Thursday.
     */
    THURSDAY("Thursday"),

    /**
     * Friday.
     */
    FRIDAY("Friday"),

    /**
     * Saturday.
     */
    SATURDAY("Saturday"),

    /**
     * Sunday.
     */
    SUNDAY("Sunday");

    /**
     * The actual serialized value for a DaysOfWeekEnum instance.
     */
    private final String value;

    DaysOfWeekEnum(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a DaysOfWeekEnum instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed DaysOfWeekEnum object, or null if unable to parse.
     */
    public static DaysOfWeekEnum fromString(String value) {
        if (value == null) {
            return null;
        }
        DaysOfWeekEnum[] items = DaysOfWeekEnum.values();
        for (DaysOfWeekEnum item : items) {
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
