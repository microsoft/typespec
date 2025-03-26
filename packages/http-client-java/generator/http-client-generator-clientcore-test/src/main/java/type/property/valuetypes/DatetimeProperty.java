package type.property.valuetypes;

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
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DatetimeProperty implements JsonSerializable<DatetimeProperty> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final OffsetDateTime property;

    /**
     * Creates an instance of DatetimeProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public DatetimeProperty(OffsetDateTime property) {
        this.property = property;
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
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DatetimeProperty.
     */
    @Metadata(generated = true)
    public static DatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OffsetDateTime property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new DatetimeProperty(property);
        });
    }
}
