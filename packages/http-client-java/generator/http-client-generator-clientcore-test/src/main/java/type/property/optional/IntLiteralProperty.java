package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with int literal property.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class IntLiteralProperty implements JsonSerializable<IntLiteralProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private IntLiteralPropertyProperty property;

    /**
     * Creates an instance of IntLiteralProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralPropertyProperty getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     *
     * @param property the property value to set.
     * @return the IntLiteralProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralProperty setProperty(IntLiteralPropertyProperty property) {
        this.property = property;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("property", this.property == null ? null : this.property.toInt());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IntLiteralProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of IntLiteralProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the IntLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static IntLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            IntLiteralProperty deserializedIntLiteralProperty = new IntLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    deserializedIntLiteralProperty.property = IntLiteralPropertyProperty.fromInt(reader.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedIntLiteralProperty;
        });
    }
}
