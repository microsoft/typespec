package encode.datetime;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Objects;

/**
 * The Rfc7231DatetimeProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Rfc7231DatetimeProperty implements JsonSerializable<Rfc7231DatetimeProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final DateTimeRfc1123 value;

    /**
     * Creates an instance of Rfc7231DatetimeProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Rfc7231DatetimeProperty(OffsetDateTime value) {
        if (value == null) {
            this.value = null;
        } else {
            this.value = new DateTimeRfc1123(value);
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getValue() {
        if (this.value == null) {
            return null;
        }
        return this.value.getDateTime();
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("value", Objects.toString(this.value, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Rfc7231DatetimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Rfc7231DatetimeProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Rfc7231DatetimeProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Rfc7231DatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OffsetDateTime value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    DateTimeRfc1123 valueHolder
                        = reader.getNullable(nonNullReader -> new DateTimeRfc1123(nonNullReader.getString()));
                    if (valueHolder != null) {
                        value = valueHolder.getDateTime();
                    }
                } else {
                    reader.skipChildren();
                }
            }
            return new Rfc7231DatetimeProperty(value);
        });
    }
}
