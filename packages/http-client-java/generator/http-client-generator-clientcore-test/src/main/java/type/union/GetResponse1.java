package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse1 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class GetResponse1 implements JsonSerializable<GetResponse1> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final GetResponseProp1 prop;

    /**
     * Creates an instance of GetResponse1 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    private GetResponse1(GetResponseProp1 prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public GetResponseProp1 getProp() {
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
     * Reads an instance of GetResponse1 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse1 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse1.
     */
    @Metadata(generated = true)
    public static GetResponse1 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            GetResponseProp1 prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = GetResponseProp1.fromValue(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new GetResponse1(prop);
        });
    }
}
