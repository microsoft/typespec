package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Model with collection bytes properties.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class CollectionsByteProperty implements JsonSerializable<CollectionsByteProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private List<byte[]> property;

    /**
     * Creates an instance of CollectionsByteProperty class.
     */
    @Metadata(generated = true)
    public CollectionsByteProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public List<byte[]> getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the CollectionsByteProperty object itself.
     */
    @Metadata(generated = true)
    public CollectionsByteProperty setProperty(List<byte[]> property) {
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
        jsonWriter.writeArrayField("property", this.property, (writer, element) -> writer.writeBinary(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CollectionsByteProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CollectionsByteProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the CollectionsByteProperty.
     */
    @Metadata(generated = true)
    public static CollectionsByteProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            CollectionsByteProperty deserializedCollectionsByteProperty = new CollectionsByteProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    List<byte[]> property = reader.readArray(reader1 -> reader1.getBinary());
                    deserializedCollectionsByteProperty.property = property;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedCollectionsByteProperty;
        });
    }
}
