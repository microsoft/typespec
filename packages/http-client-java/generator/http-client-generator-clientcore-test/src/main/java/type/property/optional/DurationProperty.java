package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;
import java.util.Objects;

/**
 * Model with a duration property.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class DurationProperty implements JsonSerializable<DurationProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private Duration property;

    /**
     * Creates an instance of DurationProperty class.
     */
    @Metadata(generated = true)
    public DurationProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public Duration getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the DurationProperty object itself.
     */
    @Metadata(generated = true)
    public DurationProperty setProperty(Duration property) {
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
        jsonWriter.writeStringField("property", Objects.toString(this.property, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DurationProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the DurationProperty.
     */
    @Metadata(generated = true)
    public static DurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            DurationProperty deserializedDurationProperty = new DurationProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedDurationProperty.property
                        = reader.getNullable(nonNullReader -> Duration.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedDurationProperty;
        });
    }
}
