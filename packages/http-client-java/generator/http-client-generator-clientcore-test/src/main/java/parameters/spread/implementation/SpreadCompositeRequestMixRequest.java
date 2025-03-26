package parameters.spread.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The SpreadCompositeRequestMixRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SpreadCompositeRequestMixRequest implements JsonSerializable<SpreadCompositeRequestMixRequest> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final String prop;

    /**
     * Creates an instance of SpreadCompositeRequestMixRequest class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    public SpreadCompositeRequestMixRequest(String prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public String getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop", this.prop);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadCompositeRequestMixRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadCompositeRequestMixRequest if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadCompositeRequestMixRequest.
     */
    @Metadata(generated = true)
    public static SpreadCompositeRequestMixRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new SpreadCompositeRequestMixRequest(prop);
        });
    }
}
