package type.enumnamespace.extensible;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.ExpandableEnum;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * Days of the week.
 */
public final class DaysOfWeekExtensibleEnum
    implements ExpandableEnum<String>, JsonSerializable<DaysOfWeekExtensibleEnum> {
    private static final Map<String, DaysOfWeekExtensibleEnum> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, DaysOfWeekExtensibleEnum> NEW_INSTANCE = DaysOfWeekExtensibleEnum::new;

    /**
     * Monday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum MONDAY = fromValue("Monday");

    /**
     * Tuesday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum TUESDAY = fromValue("Tuesday");

    /**
     * Wednesday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum WEDNESDAY = fromValue("Wednesday");

    /**
     * Thursday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum THURSDAY = fromValue("Thursday");

    /**
     * Friday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum FRIDAY = fromValue("Friday");

    /**
     * Saturday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum SATURDAY = fromValue("Saturday");

    /**
     * Sunday.
     */
    @Metadata(generated = true)
    public static final DaysOfWeekExtensibleEnum SUNDAY = fromValue("Sunday");

    private final String value;

    private DaysOfWeekExtensibleEnum(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a DaysOfWeekExtensibleEnum.
     * 
     * @param value a value to look for.
     * @return the corresponding DaysOfWeekExtensibleEnum.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(generated = true)
    public static DaysOfWeekExtensibleEnum fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known DaysOfWeekExtensibleEnum values.
     * 
     * @return Known DaysOfWeekExtensibleEnum values.
     */
    @Metadata(generated = true)
    public static Collection<DaysOfWeekExtensibleEnum> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the DaysOfWeekExtensibleEnum instance.
     * 
     * @return the value of the DaysOfWeekExtensibleEnum instance.
     */
    @Metadata(generated = true)
    @Override
    public String getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeString(getValue());
    }

    /**
     * Reads an instance of DaysOfWeekExtensibleEnum from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DaysOfWeekExtensibleEnum if the JsonReader was pointing to an instance of it, or null if
     * the JsonReader was pointing to JSON null.
     * @throws IOException If an error occurs while reading the DaysOfWeekExtensibleEnum.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(generated = true)
    public static DaysOfWeekExtensibleEnum fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return DaysOfWeekExtensibleEnum.fromValue(jsonReader.getString());
    }

    @Metadata(generated = true)
    @Override
    public String toString() {
        return Objects.toString(this.value);
    }

    @Metadata(generated = true)
    @Override
    public boolean equals(Object obj) {
        return this == obj;
    }

    @Metadata(generated = true)
    @Override
    public int hashCode() {
        return Objects.hashCode(this.value);
    }
}
