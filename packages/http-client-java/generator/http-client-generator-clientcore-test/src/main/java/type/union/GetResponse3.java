package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse3 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class GetResponse3 implements JsonSerializable<GetResponse3> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final GetResponseProp2 prop;

    /**
     * Creates an instance of GetResponse3 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    private GetResponse3(GetResponseProp2 prop) {
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
     * Reads an instance of GetResponse3 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse3 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse3.
     */
    @Metadata(generated = true)
    public static GetResponse3 fromJson(JsonReader jsonReader) throws IOException {
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
            return new GetResponse3(prop);
        });
    }
}
