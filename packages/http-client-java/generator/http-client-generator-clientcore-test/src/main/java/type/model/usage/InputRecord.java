package type.model.usage;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Record used in operation parameters.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class InputRecord implements JsonSerializable<InputRecord> {

    /*
     * The requiredProp property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String requiredProp;

    /**
     * Creates an instance of InputRecord class.
     *
     * @param requiredProp the requiredProp value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public InputRecord(String requiredProp) {
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
     * Reads an instance of InputRecord from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of InputRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InputRecord.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static InputRecord fromJson(JsonReader jsonReader) throws IOException {
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
            return new InputRecord(requiredProp);
        });
    }
}
