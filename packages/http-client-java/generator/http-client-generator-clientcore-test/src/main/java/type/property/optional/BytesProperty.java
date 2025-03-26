package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Template type for testing models with optional property. Pass in the type of the property you are looking for.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class BytesProperty implements JsonSerializable<BytesProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private byte[] property;

    /**
     * Creates an instance of BytesProperty class.
     */
    @Metadata(generated = true)
    public BytesProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public byte[] getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the BytesProperty object itself.
     */
    @Metadata(generated = true)
    public BytesProperty setProperty(byte[] property) {
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
        jsonWriter.writeBinaryField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BytesProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BytesProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the BytesProperty.
     */
    @Metadata(generated = true)
    public static BytesProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BytesProperty deserializedBytesProperty = new BytesProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedBytesProperty.property = reader.getBinary();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedBytesProperty;
        });
    }
}
