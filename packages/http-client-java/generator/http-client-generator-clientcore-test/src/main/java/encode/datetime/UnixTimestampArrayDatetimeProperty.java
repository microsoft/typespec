package encode.datetime;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * The UnixTimestampArrayDatetimeProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class UnixTimestampArrayDatetimeProperty implements JsonSerializable<UnixTimestampArrayDatetimeProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final List<Long> value;

    /**
     * Creates an instance of UnixTimestampArrayDatetimeProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public UnixTimestampArrayDatetimeProperty(List<OffsetDateTime> value) {
        if (value == null) {
            this.value = null;
        } else {
            this.value = value.stream().map(el -> el.toEpochSecond()).collect(java.util.stream.Collectors.toList());
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public List<OffsetDateTime> getValue() {
        if (this.value == null) {
            return null;
        }
        return this.value.stream()
            .map(el -> OffsetDateTime.ofInstant(Instant.ofEpochSecond(el), ZoneOffset.UTC))
            .collect(java.util.stream.Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("value", this.value, (writer, element) -> writer.writeLong(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnixTimestampArrayDatetimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnixTimestampArrayDatetimeProperty if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnixTimestampArrayDatetimeProperty.
     */
    @Metadata(generated = true)
    public static UnixTimestampArrayDatetimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<OffsetDateTime> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.readArray(
                        reader1 -> OffsetDateTime.ofInstant(Instant.ofEpochSecond(reader1.getLong()), ZoneOffset.UTC));
                } else {
                    reader.skipChildren();
                }
            }
            return new UnixTimestampArrayDatetimeProperty(value);
        });
    }
}
