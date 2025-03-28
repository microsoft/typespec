package encode.numeric.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.Objects;

/**
 * The Uint8AsStringProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Uint8AsStringProperty implements JsonSerializable<Uint8AsStringProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final int value;

    /**
     * Creates an instance of Uint8AsStringProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public Uint8AsStringProperty(int value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public int getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("value", Objects.toString(this.value, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Uint8AsStringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Uint8AsStringProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Uint8AsStringProperty.
     */
    @Metadata(generated = true)
    public static Uint8AsStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int value = Integer.parseInt("0");
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> Integer.parseInt(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new Uint8AsStringProperty(value);
        });
    }
}
