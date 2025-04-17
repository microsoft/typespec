package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with float literal property.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class FloatLiteralProperty implements JsonSerializable<FloatLiteralProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private FloatLiteralPropertyProperty property;

    /**
     * Creates an instance of FloatLiteralProperty class.
     */
    @Metadata(generated = true)
    public FloatLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public FloatLiteralPropertyProperty getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the FloatLiteralProperty object itself.
     */
    @Metadata(generated = true)
    public FloatLiteralProperty setProperty(FloatLiteralPropertyProperty property) {
        this.property = property;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("property", this.property == null ? null : this.property.toDouble());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of FloatLiteralProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatLiteralProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the FloatLiteralProperty.
     */
    @Metadata(generated = true)
    public static FloatLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            FloatLiteralProperty deserializedFloatLiteralProperty = new FloatLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedFloatLiteralProperty.property
                        = FloatLiteralPropertyProperty.fromDouble(reader.getDouble());
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedFloatLiteralProperty;
        });
    }
}
