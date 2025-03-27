package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a property unknown, and the data is a string.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class UnknownStringProperty implements JsonSerializable<UnknownStringProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final BinaryData property;

    /**
     * Creates an instance of UnknownStringProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public UnknownStringProperty(BinaryData property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public BinaryData getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeFieldName("property");
        this.property.writeTo(jsonWriter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnknownStringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnknownStringProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnknownStringProperty.
     */
    @Metadata(generated = true)
    public static UnknownStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BinaryData property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            return new UnknownStringProperty(property);
        });
    }
}
