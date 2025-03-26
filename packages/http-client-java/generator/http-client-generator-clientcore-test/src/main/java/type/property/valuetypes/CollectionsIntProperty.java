package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Model with collection int properties.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class CollectionsIntProperty implements JsonSerializable<CollectionsIntProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final List<Integer> property;

    /**
     * Creates an instance of CollectionsIntProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public CollectionsIntProperty(List<Integer> property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public List<Integer> getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("property", this.property, (writer, element) -> writer.writeInt(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CollectionsIntProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CollectionsIntProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CollectionsIntProperty.
     */
    @Metadata(generated = true)
    public static CollectionsIntProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Integer> property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.readArray(reader1 -> reader1.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            return new CollectionsIntProperty(property);
        });
    }
}
