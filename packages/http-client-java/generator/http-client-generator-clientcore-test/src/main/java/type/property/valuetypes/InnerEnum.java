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
 * Enum that will be used as a property for model EnumProperty. Extensible.
 */
public final class InnerEnum implements ExpandableEnum<String>, JsonSerializable<InnerEnum> {
    private static final Map<String, InnerEnum> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, InnerEnum> NEW_INSTANCE = InnerEnum::new;

    /**
     * First value.
     */
    @Metadata(generated = true)
    public static final InnerEnum VALUE_ONE = fromValue("ValueOne");

    /**
     * Second value.
     */
    @Metadata(generated = true)
    public static final InnerEnum VALUE_TWO = fromValue("ValueTwo");

    private final String value;

    private InnerEnum(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a InnerEnum.
     * 
     * @param value a value to look for.
     * @return the corresponding InnerEnum.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(generated = true)
    public static InnerEnum fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known InnerEnum values.
     * 
     * @return Known InnerEnum values.
     */
    @Metadata(generated = true)
    public static Collection<InnerEnum> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the InnerEnum instance.
     * 
     * @return the value of the InnerEnum instance.
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
     * Reads an instance of InnerEnum from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of InnerEnum if the JsonReader was pointing to an instance of it, or null if the JsonReader
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the InnerEnum.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(generated = true)
    public static InnerEnum fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return InnerEnum.fromValue(jsonReader.getString());
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
