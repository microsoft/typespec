package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Model with a plainDate property.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class PlainDateProperty implements JsonSerializable<PlainDateProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private LocalDate property;

    /**
     * Creates an instance of PlainDateProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainDateProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public LocalDate getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     *
     * @param property the property value to set.
     * @return the PlainDateProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainDateProperty setProperty(LocalDate property) {
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
        jsonWriter.writeStringField("property", Objects.toString(this.property, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PlainDateProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of PlainDateProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the PlainDateProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PlainDateProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            PlainDateProperty deserializedPlainDateProperty = new PlainDateProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    deserializedPlainDateProperty.property
                        = reader.getNullable(nonNullReader -> LocalDate.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedPlainDateProperty;
        });
    }
}
