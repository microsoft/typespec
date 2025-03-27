package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a union of int literal as property.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class UnionIntLiteralProperty implements JsonSerializable<UnionIntLiteralProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final UnionIntLiteralPropertyProperty property;

    /**
     * Creates an instance of UnionIntLiteralProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public UnionIntLiteralProperty(UnionIntLiteralPropertyProperty property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public UnionIntLiteralPropertyProperty getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("property", this.property == null ? null : this.property.toInt());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnionIntLiteralProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnionIntLiteralProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnionIntLiteralProperty.
     */
    @Metadata(generated = true)
    public static UnionIntLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionIntLiteralPropertyProperty property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = UnionIntLiteralPropertyProperty.fromInt(reader.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            return new UnionIntLiteralProperty(property);
        });
    }
}
