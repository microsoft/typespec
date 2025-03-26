package type.model.usage;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Record used in operation return type.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class OutputRecord implements JsonSerializable<OutputRecord> {
    /*
     * The requiredProp property.
     */
    @Metadata(generated = true)
    private final String requiredProp;

    /**
     * Creates an instance of OutputRecord class.
     * 
     * @param requiredProp the requiredProp value to set.
     */
    @Metadata(generated = true)
    private OutputRecord(String requiredProp) {
        this.requiredProp = requiredProp;
    }

    /**
     * Get the requiredProp property: The requiredProp property.
     * 
     * @return the requiredProp value.
     */
    @Metadata(generated = true)
    public String getRequiredProp() {
        return this.requiredProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("requiredProp", this.requiredProp);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of OutputRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of OutputRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the OutputRecord.
     */
    @Metadata(generated = true)
    public static OutputRecord fromJson(JsonReader jsonReader) throws IOException {
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
            return new OutputRecord(requiredProp);
        });
    }
}
