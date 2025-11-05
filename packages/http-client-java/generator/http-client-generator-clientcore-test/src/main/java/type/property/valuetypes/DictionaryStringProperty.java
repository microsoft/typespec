package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.Map;

/**
 * Model with dictionary string properties.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class DictionaryStringProperty implements JsonSerializable<DictionaryStringProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Map<String, String> property;

    /**
     * Creates an instance of DictionaryStringProperty class.
     *
     * @param property the property value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DictionaryStringProperty(Map<String, String> property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Map<String, String> getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeMapField("property", this.property, (writer, element) -> writer.writeString(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DictionaryStringProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of DictionaryStringProperty if the JsonReader was pointing to an instance of it, or null if
     * it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DictionaryStringProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static DictionaryStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Map<String, String> property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    property = reader.readMap(reader1 -> reader1.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new DictionaryStringProperty(property);
        });
    }
}
