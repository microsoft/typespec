package response.bodyornocontent;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The BlobLayout model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class BlobLayout implements JsonSerializable<BlobLayout> {
    /*
     * The content property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String content;

    /**
     * Creates an instance of BlobLayout class.
     * 
     * @param content the content value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private BlobLayout(String content) {
        this.content = content;
    }

    /**
     * Get the content property: The content property.
     * 
     * @return the content value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getContent() {
        return this.content;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("content", this.content);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BlobLayout from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BlobLayout if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the BlobLayout.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static BlobLayout fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String content = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("content".equals(fieldName)) {
                    content = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new BlobLayout(content);
        });
    }
}
