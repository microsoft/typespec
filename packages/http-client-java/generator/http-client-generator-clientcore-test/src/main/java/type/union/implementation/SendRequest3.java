package type.union.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import type.union.GetResponseProp2;

/**
 * The SendRequest3 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SendRequest3 implements JsonSerializable<SendRequest3> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final GetResponseProp2 prop;

    /**
     * Creates an instance of SendRequest3 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    public SendRequest3(GetResponseProp2 prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public GetResponseProp2 getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("prop", this.prop == null ? null : this.prop.toInt());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SendRequest3 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendRequest3 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SendRequest3.
     */
    @Metadata(generated = true)
    public static SendRequest3 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            GetResponseProp2 prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = GetResponseProp2.fromInt(reader.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            return new SendRequest3(prop);
        });
    }
}
