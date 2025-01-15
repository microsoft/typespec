// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.union.implementation;

import io.clientcore.core.annotation.Metadata;
import io.clientcore.core.annotation.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import type.union.StringExtensibleNamedUnion;

/**
 * The SendRequest7 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SendRequest7 implements JsonSerializable<SendRequest7> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final StringExtensibleNamedUnion prop;

    /**
     * Creates an instance of SendRequest7 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    public SendRequest7(StringExtensibleNamedUnion prop) {
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
     * Reads an instance of SendRequest7 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendRequest7 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SendRequest7.
     */
    @Metadata(generated = true)
    public static SendRequest7 fromJson(JsonReader jsonReader) throws IOException {
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
            return new SendRequest7(prop);
        });
    }
}
