package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The TodoAttachment model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class TodoAttachment implements JsonSerializable<TodoAttachment> {
    /*
     * The file name of the attachment
     */
    @Metadata(generated = true)
    private final String filename;

    /*
     * The media type of the attachment
     */
    @Metadata(generated = true)
    private final String mediaType;

    /*
     * The contents of the file
     */
    @Metadata(generated = true)
    private final byte[] contents;

    /**
     * Creates an instance of TodoAttachment class.
     * 
     * @param filename the filename value to set.
     * @param mediaType the mediaType value to set.
     * @param contents the contents value to set.
     */
    @Metadata(generated = true)
    public TodoAttachment(String filename, String mediaType, byte[] contents) {
        this.filename = filename;
        this.mediaType = mediaType;
        this.contents = contents;
    }

    /**
     * Get the filename property: The file name of the attachment.
     * 
     * @return the filename value.
     */
    @Metadata(generated = true)
    public String getFilename() {
        return this.filename;
    }

    /**
     * Get the mediaType property: The media type of the attachment.
     * 
     * @return the mediaType value.
     */
    @Metadata(generated = true)
    public String getMediaType() {
        return this.mediaType;
    }

    /**
     * Get the contents property: The contents of the file.
     * 
     * @return the contents value.
     */
    @Metadata(generated = true)
    public byte[] getContents() {
        return this.contents;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("filename", this.filename);
        jsonWriter.writeStringField("mediaType", this.mediaType);
        jsonWriter.writeBinaryField("contents", this.contents);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TodoAttachment from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TodoAttachment if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TodoAttachment.
     */
    @Metadata(generated = true)
    public static TodoAttachment fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String filename = null;
            String mediaType = null;
            byte[] contents = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("filename".equals(fieldName)) {
                    filename = reader.getString();
                } else if ("mediaType".equals(fieldName)) {
                    mediaType = reader.getString();
                } else if ("contents".equals(fieldName)) {
                    contents = reader.getBinary();
                } else {
                    reader.skipChildren();
                }
            }
            return new TodoAttachment(filename, mediaType, contents);
        });
    }
}
