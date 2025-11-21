package todo;

/**
 * Defines values for TodoItemStatus.
 */
public enum TodoItemStatus {
    /**
     * Enum value NotStarted.
     */
    NOT_STARTED("NotStarted"),

    /**
     * Enum value InProgress.
     */
    IN_PROGRESS("InProgress"),

    /**
     * Enum value Completed.
     */
    COMPLETED("Completed");

    /**
     * The actual serialized value for a TodoItemStatus instance.
     */
    private final String value;

    TodoItemStatus(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a TodoItemStatus instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed TodoItemStatus object, or null if unable to parse.
     */
    public static TodoItemStatus fromString(String value) {
        if (value == null) {
            return null;
        }
        TodoItemStatus[] items = TodoItemStatus.values();
        for (TodoItemStatus item : items) {
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
