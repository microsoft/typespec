package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a string property.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class StringProperty implements JsonSerializable<StringProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final String property;

    /**
     * Creates an instance of StringProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public StringProperty(String property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public String getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of StringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of StringProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the StringProperty.
     */
    @Metadata(generated = true)
    public static StringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new StringProperty(property);
        });
    }
}
