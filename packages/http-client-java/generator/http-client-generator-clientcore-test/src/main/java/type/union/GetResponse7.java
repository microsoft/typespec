package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse7 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class GetResponse7 implements JsonSerializable<GetResponse7> {
    /*
     * The prop property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringAndArrayCases prop;

    /**
     * Creates an instance of GetResponse7 class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private GetResponse7(StringAndArrayCases prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringAndArrayCases getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("prop", this.prop);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of GetResponse7 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse7 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse7.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static GetResponse7 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            StringAndArrayCases prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = StringAndArrayCases.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            return new GetResponse7(prop);
        });
    }
}
