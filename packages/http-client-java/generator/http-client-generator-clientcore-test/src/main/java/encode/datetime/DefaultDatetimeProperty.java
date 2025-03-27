package encode.datetime;

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
 * The DefaultDatetimeProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DefaultDatetimeProperty implements JsonSerializable<DefaultDatetimeProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final OffsetDateTime value;

    /**
     * Creates an instance of DefaultDatetimeProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public DefaultDatetimeProperty(OffsetDateTime value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public OffsetDateTime getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("value",
            this.value == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.value));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DefaultDatetimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DefaultDatetimeProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DefaultDatetimeProperty.
     */
    @Metadata(generated = true)
    public static DefaultDatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OffsetDateTime value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new DefaultDatetimeProperty(value);
        });
    }
}
