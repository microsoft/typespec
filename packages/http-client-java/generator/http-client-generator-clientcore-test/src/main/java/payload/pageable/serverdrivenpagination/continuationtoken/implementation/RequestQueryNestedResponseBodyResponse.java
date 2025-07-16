package payload.pageable.serverdrivenpagination.continuationtoken.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import payload.pageable.serverdrivenpagination.continuationtoken.RequestQueryNestedResponseBodyResponseNestedItems;
import payload.pageable.serverdrivenpagination.continuationtoken.RequestQueryNestedResponseBodyResponseNestedNext;

/**
 * The RequestQueryNestedResponseBodyResponse model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RequestQueryNestedResponseBodyResponse
    implements JsonSerializable<RequestQueryNestedResponseBodyResponse> {
    /*
     * The nestedItems property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RequestQueryNestedResponseBodyResponseNestedItems nestedItems;

    /*
     * The nestedNext property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestQueryNestedResponseBodyResponseNestedNext nestedNext;

    /**
     * Creates an instance of RequestQueryNestedResponseBodyResponse class.
     * 
     * @param nestedItems the nestedItems value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestQueryNestedResponseBodyResponse(RequestQueryNestedResponseBodyResponseNestedItems nestedItems) {
        this.nestedItems = nestedItems;
    }

    /**
     * Get the nestedItems property: The nestedItems property.
     * 
     * @return the nestedItems value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequestQueryNestedResponseBodyResponseNestedItems getNestedItems() {
        return this.nestedItems;
    }

    /**
     * Get the nestedNext property: The nestedNext property.
     * 
     * @return the nestedNext value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequestQueryNestedResponseBodyResponseNestedNext getNestedNext() {
        return this.nestedNext;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("nestedItems", this.nestedItems);
        jsonWriter.writeJsonField("nestedNext", this.nestedNext);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestQueryNestedResponseBodyResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestQueryNestedResponseBodyResponse if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RequestQueryNestedResponseBodyResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequestQueryNestedResponseBodyResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            RequestQueryNestedResponseBodyResponseNestedItems nestedItems = null;
            RequestQueryNestedResponseBodyResponseNestedNext nestedNext = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("nestedItems".equals(fieldName)) {
                    nestedItems = RequestQueryNestedResponseBodyResponseNestedItems.fromJson(reader);
                } else if ("nestedNext".equals(fieldName)) {
                    nestedNext = RequestQueryNestedResponseBodyResponseNestedNext.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            RequestQueryNestedResponseBodyResponse deserializedRequestQueryNestedResponseBodyResponse
                = new RequestQueryNestedResponseBodyResponse(nestedItems);
            deserializedRequestQueryNestedResponseBodyResponse.nestedNext = nestedNext;

            return deserializedRequestQueryNestedResponseBodyResponse;
        });
    }
}
