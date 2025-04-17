package type.property.valuetypes;

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
 * Defines values for ExtendedEnum.
 */
public final class ExtendedEnum implements ExpandableEnum<String>, JsonSerializable<ExtendedEnum> {
    private static final Map<String, ExtendedEnum> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, ExtendedEnum> NEW_INSTANCE = ExtendedEnum::new;

    /**
     * Static value value2 for ExtendedEnum.
     */
    @Metadata(generated = true)
    public static final ExtendedEnum ENUM_VALUE2 = fromValue("value2");

    private final String value;

    private ExtendedEnum(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a ExtendedEnum.
     * 
     * @param value a value to look for.
     * @return the corresponding ExtendedEnum.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(generated = true)
    public static ExtendedEnum fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known ExtendedEnum values.
     * 
     * @return Known ExtendedEnum values.
     */
    @Metadata(generated = true)
    public static Collection<ExtendedEnum> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the ExtendedEnum instance.
     * 
     * @return the value of the ExtendedEnum instance.
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
     * Reads an instance of ExtendedEnum from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExtendedEnum if the JsonReader was pointing to an instance of it, or null if the
     * JsonReader was pointing to JSON null.
     * @throws IOException If an error occurs while reading the ExtendedEnum.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(generated = true)
    public static ExtendedEnum fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return ExtendedEnum.fromValue(jsonReader.getString());
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
