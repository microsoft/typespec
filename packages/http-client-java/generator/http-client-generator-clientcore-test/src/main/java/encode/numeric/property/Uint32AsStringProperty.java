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
 * The Uint32AsStringProperty model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class Uint32AsStringProperty implements JsonSerializable<Uint32AsStringProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private Integer value;

    /**
     * Creates an instance of Uint32AsStringProperty class.
     */
    @Metadata(generated = true)
    public Uint32AsStringProperty() {
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public Integer getValue() {
        return this.value;
    }

    /**
     * Set the value property: The value property.
     * 
     * @param value the value value to set.
     * @return the Uint32AsStringProperty object itself.
     */
    @Metadata(generated = true)
    public Uint32AsStringProperty setValue(Integer value) {
        this.value = value;
        return this;
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
     * Reads an instance of Uint32AsStringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Uint32AsStringProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the Uint32AsStringProperty.
     */
    @Metadata(generated = true)
    public static Uint32AsStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Uint32AsStringProperty deserializedUint32AsStringProperty = new Uint32AsStringProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    deserializedUint32AsStringProperty.value
                        = reader.getNullable(nonNullReader -> Integer.parseInt(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedUint32AsStringProperty;
        });
    }
}
