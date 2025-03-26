package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Model with a datetime property.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class DatetimeProperty implements JsonSerializable<DatetimeProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private OffsetDateTime property;

    /**
     * Creates an instance of DatetimeProperty class.
     */
    @Metadata(generated = true)
    public DatetimeProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public OffsetDateTime getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the DatetimeProperty object itself.
     */
    @Metadata(generated = true)
    public DatetimeProperty setProperty(OffsetDateTime property) {
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
        jsonWriter.writeStringField("property",
            this.property == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.property));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DatetimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DatetimeProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the DatetimeProperty.
     */
    @Metadata(generated = true)
    public static DatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            DatetimeProperty deserializedDatetimeProperty = new DatetimeProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedDatetimeProperty.property
                        = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedDatetimeProperty;
        });
    }
}
