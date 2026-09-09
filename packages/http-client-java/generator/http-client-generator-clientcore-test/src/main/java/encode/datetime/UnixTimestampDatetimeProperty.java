package encode.datetime;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * The UnixTimestampDatetimeProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UnixTimestampDatetimeProperty implements JsonSerializable<UnixTimestampDatetimeProperty> {

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final long value;

    /**
     * Creates an instance of UnixTimestampDatetimeProperty class.
     *
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnixTimestampDatetimeProperty(OffsetDateTime value) {
        if (value == null) {
            this.value = 0L;
        } else {
            this.value = value.toEpochSecond();
        }
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getValue() {
        return OffsetDateTime.ofInstant(Instant.ofEpochSecond(this.value), ZoneOffset.UTC);
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeLongField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnixTimestampDatetimeProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnixTimestampDatetimeProperty if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnixTimestampDatetimeProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static UnixTimestampDatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OffsetDateTime value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("value".equals(fieldName)) {
                    value = OffsetDateTime.ofInstant(Instant.ofEpochSecond(reader.getLong()), ZoneOffset.UTC);
                } else {
                    reader.skipChildren();
                }
            }
            return new UnixTimestampDatetimeProperty(value);
        });
    }
}
