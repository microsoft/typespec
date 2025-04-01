package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a property never. (This property should not be included).
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class NeverProperty implements JsonSerializable<NeverProperty> {
    /**
     * Creates an instance of NeverProperty class.
     */
    @Metadata(generated = true)
    public NeverProperty() {
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of NeverProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of NeverProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the NeverProperty.
     */
    @Metadata(generated = true)
    public static NeverProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            NeverProperty deserializedNeverProperty = new NeverProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedNeverProperty;
        });
    }
}
