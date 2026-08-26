package payload.contentnegotiation.differentbody;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The PngImageAsJson model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class PngImageAsJson implements JsonSerializable<PngImageAsJson> {
    /*
     * The content property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final byte[] content;

    /**
     * Creates an instance of PngImageAsJson class.
     * 
     * @param content the content value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PngImageAsJson(byte[] content) {
        this.content = content;
    }

    /**
     * Get the content property: The content property.
     * 
     * @return the content value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public byte[] getContent() {
        return this.content;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeBinaryField("content", this.content);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PngImageAsJson from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PngImageAsJson if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PngImageAsJson.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PngImageAsJson fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            byte[] content = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("content".equals(fieldName)) {
                    content = reader.getBinary();
                } else {
                    reader.skipChildren();
                }
            }
            return new PngImageAsJson(content);
        });
    }
}
