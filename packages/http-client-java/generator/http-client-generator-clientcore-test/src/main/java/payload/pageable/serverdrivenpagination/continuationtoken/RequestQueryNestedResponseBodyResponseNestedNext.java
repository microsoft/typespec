package payload.pageable.serverdrivenpagination.continuationtoken;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The RequestQueryNestedResponseBodyResponseNestedNext model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RequestQueryNestedResponseBodyResponseNestedNext
    implements JsonSerializable<RequestQueryNestedResponseBodyResponseNestedNext> {

    /*
     * The nextToken property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String nextToken;

    /**
     * Creates an instance of RequestQueryNestedResponseBodyResponseNestedNext class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestQueryNestedResponseBodyResponseNestedNext() {
    }

    /**
     * Get the nextToken property: The nextToken property.
     *
     * @return the nextToken value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNextToken() {
        return this.nextToken;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("nextToken", this.nextToken);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestQueryNestedResponseBodyResponseNestedNext from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestQueryNestedResponseBodyResponseNestedNext if the JsonReader was pointing to an
     * instance of it, or null if it was pointing to JSON null.
     * @throws IOException If an error occurs while reading the RequestQueryNestedResponseBodyResponseNestedNext.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequestQueryNestedResponseBodyResponseNestedNext fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            RequestQueryNestedResponseBodyResponseNestedNext deserializedRequestQueryNestedResponseBodyResponseNestedNext
                = new RequestQueryNestedResponseBodyResponseNestedNext();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("nextToken".equals(fieldName)) {
                    deserializedRequestQueryNestedResponseBodyResponseNestedNext.nextToken = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedRequestQueryNestedResponseBodyResponseNestedNext;
        });
    }
}
