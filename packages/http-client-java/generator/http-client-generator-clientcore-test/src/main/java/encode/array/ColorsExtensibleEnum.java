package encode.array;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
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
 * Defines values for ColorsExtensibleEnum.
 */
public final class ColorsExtensibleEnum implements ExpandableEnum<String>, JsonSerializable<ColorsExtensibleEnum> {
    private static final Map<String, ColorsExtensibleEnum> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, ColorsExtensibleEnum> NEW_INSTANCE = ColorsExtensibleEnum::new;

    /**
     * Static value blue for ColorsExtensibleEnum.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ColorsExtensibleEnum BLUE = fromValue("blue");

    /**
     * Static value red for ColorsExtensibleEnum.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ColorsExtensibleEnum RED = fromValue("red");

    /**
     * Static value green for ColorsExtensibleEnum.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final ColorsExtensibleEnum GREEN = fromValue("green");

    private final String value;

    private ColorsExtensibleEnum(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a ColorsExtensibleEnum.
     * 
     * @param value a value to look for.
     * @return the corresponding ColorsExtensibleEnum.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ColorsExtensibleEnum fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known ColorsExtensibleEnum values.
     * 
     * @return Known ColorsExtensibleEnum values.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Collection<ColorsExtensibleEnum> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the ColorsExtensibleEnum instance.
     * 
     * @return the value of the ColorsExtensibleEnum instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeString(getValue());
    }

    /**
     * Reads an instance of ColorsExtensibleEnum from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ColorsExtensibleEnum if the JsonReader was pointing to an instance of it, or null if the
     * JsonReader was pointing to JSON null.
     * @throws IOException If an error occurs while reading the ColorsExtensibleEnum.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ColorsExtensibleEnum fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return ColorsExtensibleEnum.fromValue(jsonReader.getString());
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String toString() {
        return Objects.toString(this.value);
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public boolean equals(Object obj) {
        return this == obj;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public int hashCode() {
        return Objects.hashCode(this.value);
    }
}
