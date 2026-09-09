package payload.pageable.serverdrivenpagination;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The NestedLinkResponseNestedNext model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class NestedLinkResponseNestedNext implements JsonSerializable<NestedLinkResponseNestedNext> {

    /*
     * The next property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String next;

    /**
     * Creates an instance of NestedLinkResponseNestedNext class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private NestedLinkResponseNestedNext() {
    }

    /**
     * Get the next property: The next property.
     *
     * @return the next value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNext() {
        return this.next;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("next", this.next);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of NestedLinkResponseNestedNext from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of NestedLinkResponseNestedNext if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IOException If an error occurs while reading the NestedLinkResponseNestedNext.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static NestedLinkResponseNestedNext fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            NestedLinkResponseNestedNext deserializedNestedLinkResponseNestedNext = new NestedLinkResponseNestedNext();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("next".equals(fieldName)) {
                    deserializedNestedLinkResponseNestedNext.next = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedNestedLinkResponseNestedNext;
        });
    }
}
