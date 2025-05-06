package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse4 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class GetResponse4 implements JsonSerializable<GetResponse4> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final GetResponseProp3 prop;

    /**
     * Creates an instance of GetResponse4 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    private GetResponse4(GetResponseProp3 prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public GetResponseProp3 getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("prop", this.prop == null ? null : this.prop.toDouble());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of GetResponse4 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse4 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse4.
     */
    @Metadata(generated = true)
    public static GetResponse4 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            GetResponseProp3 prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = GetResponseProp3.fromDouble(reader.getDouble());
                } else {
                    reader.skipChildren();
                }
            }
            return new GetResponse4(prop);
        });
    }
}
