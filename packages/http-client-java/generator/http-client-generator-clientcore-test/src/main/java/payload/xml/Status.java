package payload.xml;

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
 * Status values for the model with enum.
 */
public final class Status implements ExpandableEnum<String>, JsonSerializable<Status> {
    private static final Map<String, Status> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, Status> NEW_INSTANCE = Status::new;

    /**
     * Pending status.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final Status PENDING = fromValue("pending");

    /**
     * Success status.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final Status SUCCESS = fromValue("success");

    /**
     * Error status.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static final Status ERROR = fromValue("error");

    private final String value;

    private Status(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a Status.
     * 
     * @param value a value to look for.
     * @return the corresponding Status.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Status fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known Status values.
     * 
     * @return Known Status values.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Collection<Status> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the Status instance.
     * 
     * @return the value of the Status instance.
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
     * Reads an instance of Status from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Status if the JsonReader was pointing to an instance of it, or null if the JsonReader was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the Status.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Status fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return Status.fromValue(jsonReader.getString());
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
