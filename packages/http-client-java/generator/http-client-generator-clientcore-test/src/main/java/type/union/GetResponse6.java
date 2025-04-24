package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse6 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class GetResponse6 implements JsonSerializable<GetResponse6> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final EnumsOnlyCases prop;

    /**
     * Creates an instance of GetResponse6 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(generated = true)
    private GetResponse6(EnumsOnlyCases prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public EnumsOnlyCases getProp() {
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
     * Reads an instance of GetResponse6 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse6 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse6.
     */
    @Metadata(generated = true)
    public static GetResponse6 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            EnumsOnlyCases prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = EnumsOnlyCases.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            return new GetResponse6(prop);
        });
    }
}
