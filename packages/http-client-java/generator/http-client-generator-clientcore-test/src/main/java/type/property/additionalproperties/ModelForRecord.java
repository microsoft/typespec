package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * model for record.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ModelForRecord implements JsonSerializable<ModelForRecord> {
    /*
     * The state property
     */
    @Metadata(generated = true)
    private final String state;

    /**
     * Creates an instance of ModelForRecord class.
     * 
     * @param state the state value to set.
     */
    @Metadata(generated = true)
    public ModelForRecord(String state) {
        this.state = state;
    }

    /**
     * Get the state property: The state property.
     * 
     * @return the state value.
     */
    @Metadata(generated = true)
    public String getState() {
        return this.state;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("state", this.state);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ModelForRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ModelForRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ModelForRecord.
     */
    @Metadata(generated = true)
    public static ModelForRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String state = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("state".equals(fieldName)) {
                    state = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new ModelForRecord(state);
        });
    }
}
