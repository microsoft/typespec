package type.union.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import type.union.StringExtensibleNamedUnion;

/**
 * The SendRequest2 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SendRequest2 implements JsonSerializable<SendRequest2> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final StringExtensibleNamedUnion prop;

    /**
     * Creates an instance of SendRequest2 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    public SendRequest2(StringExtensibleNamedUnion prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public StringExtensibleNamedUnion getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop", this.prop == null ? null : this.prop.getValue());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SendRequest2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendRequest2 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SendRequest2.
     */
    @Metadata(generated = true)
    public static SendRequest2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            StringExtensibleNamedUnion prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = StringExtensibleNamedUnion.fromValue(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new SendRequest2(prop);
        });
    }
}
