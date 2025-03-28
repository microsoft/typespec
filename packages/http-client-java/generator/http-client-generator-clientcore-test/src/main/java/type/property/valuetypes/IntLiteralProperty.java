package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a int literal property.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class IntLiteralProperty implements JsonSerializable<IntLiteralProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final int property = 42;

    /**
     * Creates an instance of IntLiteralProperty class.
     */
    @Metadata(generated = true)
    public IntLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public int getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IntLiteralProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of IntLiteralProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the IntLiteralProperty.
     */
    @Metadata(generated = true)
    public static IntLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            IntLiteralProperty deserializedIntLiteralProperty = new IntLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedIntLiteralProperty;
        });
    }
}
