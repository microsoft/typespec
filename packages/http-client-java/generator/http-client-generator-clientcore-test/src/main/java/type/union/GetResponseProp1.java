package type.union;

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
 * Defines values for GetResponseProp1.
 */
public final class GetResponseProp1 implements ExpandableEnum<String>, JsonSerializable<GetResponseProp1> {
    private static final Map<String, GetResponseProp1> VALUES = new ConcurrentHashMap<>();

    private static final Function<String, GetResponseProp1> NEW_INSTANCE = GetResponseProp1::new;

    /**
     * Static value b for GetResponseProp1.
     */
    @Metadata(generated = true)
    public static final GetResponseProp1 B = fromValue("b");

    /**
     * Static value c for GetResponseProp1.
     */
    @Metadata(generated = true)
    public static final GetResponseProp1 C = fromValue("c");

    private final String value;

    private GetResponseProp1(String value) {
        this.value = value;
    }

    /**
     * Creates or finds a GetResponseProp1.
     * 
     * @param value a value to look for.
     * @return the corresponding GetResponseProp1.
     * @throws IllegalArgumentException if value is null.
     */
    @Metadata(generated = true)
    public static GetResponseProp1 fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("'value' cannot be null.");
        }
        return VALUES.computeIfAbsent(value, NEW_INSTANCE);
    }

    /**
     * Gets known GetResponseProp1 values.
     * 
     * @return Known GetResponseProp1 values.
     */
    @Metadata(generated = true)
    public static Collection<GetResponseProp1> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the GetResponseProp1 instance.
     * 
     * @return the value of the GetResponseProp1 instance.
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
     * Reads an instance of GetResponseProp1 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponseProp1 if the JsonReader was pointing to an instance of it, or null if the
     * JsonReader was pointing to JSON null.
     * @throws IOException If an error occurs while reading the GetResponseProp1.
     * @throws IllegalStateException If unexpected JSON token is found.
     */
    @Metadata(generated = true)
    public static GetResponseProp1 fromJson(JsonReader jsonReader) throws IOException {
        JsonToken nextToken = jsonReader.nextToken();
        if (nextToken == JsonToken.NULL) {
            return null;
        }
        if (nextToken != JsonToken.STRING) {
            throw new IllegalStateException(
                String.format("Unexpected JSON token for %s deserialization: %s", JsonToken.STRING, nextToken));
        }
        return GetResponseProp1.fromValue(jsonReader.getString());
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
