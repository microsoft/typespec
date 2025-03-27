package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with enum properties.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class EnumProperty implements JsonSerializable<EnumProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final FixedInnerEnum property;

    /**
     * Creates an instance of EnumProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public EnumProperty(FixedInnerEnum property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public FixedInnerEnum getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("property", this.property == null ? null : this.property.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of EnumProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of EnumProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the EnumProperty.
     */
    @Metadata(generated = true)
    public static EnumProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            FixedInnerEnum property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = FixedInnerEnum.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new EnumProperty(property);
        });
    }
}
