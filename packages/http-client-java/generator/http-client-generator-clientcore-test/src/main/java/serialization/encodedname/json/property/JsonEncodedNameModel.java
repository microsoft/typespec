package serialization.encodedname.json.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The JsonEncodedNameModel model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class JsonEncodedNameModel implements JsonSerializable<JsonEncodedNameModel> {
    /*
     * Pass in true
     */
    @Metadata(generated = true)
    private final boolean defaultName;

    /**
     * Creates an instance of JsonEncodedNameModel class.
     * 
     * @param defaultName the defaultName value to set.
     */
    @Metadata(generated = true)
    public JsonEncodedNameModel(boolean defaultName) {
        this.defaultName = defaultName;
    }

    /**
     * Get the defaultName property: Pass in true.
     * 
     * @return the defaultName value.
     */
    @Metadata(generated = true)
    public boolean isDefaultName() {
        return this.defaultName;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeBooleanField("wireName", this.defaultName);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of JsonEncodedNameModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of JsonEncodedNameModel if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the JsonEncodedNameModel.
     */
    @Metadata(generated = true)
    public static JsonEncodedNameModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            boolean defaultName = false;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("wireName".equals(fieldName)) {
                    defaultName = reader.getBoolean();
                } else {
                    reader.skipChildren();
                }
            }
            return new JsonEncodedNameModel(defaultName);
        });
    }
}
