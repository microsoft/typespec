package type.model.usage;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Record used both as operation parameter and return type.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class InputOutputRecord implements JsonSerializable<InputOutputRecord> {

    /*
     * The requiredProp property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String requiredProp;

    /**
     * Creates an instance of InputOutputRecord class.
     *
     * @param requiredProp the requiredProp value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public InputOutputRecord(String requiredProp) {
        this.requiredProp = requiredProp;
    }

    /**
     * Get the requiredProp property: The requiredProp property.
     *
     * @return the requiredProp value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getRequiredProp() {
        return this.requiredProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("requiredProp", this.requiredProp);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of InputOutputRecord from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of InputOutputRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InputOutputRecord.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static InputOutputRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String requiredProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("requiredProp".equals(fieldName)) {
                    requiredProp = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new InputOutputRecord(requiredProp);
        });
    }
}
