package type.union.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import type.union.MixedTypesCases;

/**
 * The SendRequest9 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SendRequest9 implements JsonSerializable<SendRequest9> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final MixedTypesCases prop;

    /**
     * Creates an instance of SendRequest9 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    public SendRequest9(MixedTypesCases prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public MixedTypesCases getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("prop", this.prop);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SendRequest9 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendRequest9 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SendRequest9.
     */
    @Metadata(generated = true)
    public static SendRequest9 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            MixedTypesCases prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = MixedTypesCases.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            return new SendRequest9(prop);
        });
    }
}
