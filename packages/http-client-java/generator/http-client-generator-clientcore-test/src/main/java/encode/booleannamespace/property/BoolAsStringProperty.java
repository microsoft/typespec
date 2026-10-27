package encode.booleannamespace.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The BoolAsStringProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class BoolAsStringProperty implements JsonSerializable<BoolAsStringProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean value;

    /**
     * Creates an instance of BoolAsStringProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BoolAsStringProperty(boolean value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeBooleanField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BoolAsStringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BoolAsStringProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the BoolAsStringProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static BoolAsStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            boolean value = false;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getBoolean();
                } else {
                    reader.skipChildren();
                }
            }
            return new BoolAsStringProperty(value);
        });
    }
}
