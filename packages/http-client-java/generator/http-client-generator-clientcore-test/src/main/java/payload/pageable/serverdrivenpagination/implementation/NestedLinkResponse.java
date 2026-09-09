package payload.pageable.serverdrivenpagination.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import payload.pageable.serverdrivenpagination.NestedLinkResponseNestedItems;
import payload.pageable.serverdrivenpagination.NestedLinkResponseNestedNext;

/**
 * The NestedLinkResponse model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class NestedLinkResponse implements JsonSerializable<NestedLinkResponse> {

    /*
     * The nestedItems property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NestedLinkResponseNestedItems nestedItems;

    /*
     * The nestedNext property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NestedLinkResponseNestedNext nestedNext;

    /**
     * Creates an instance of NestedLinkResponse class.
     *
     * @param nestedItems the nestedItems value to set.
     * @param nestedNext the nestedNext value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private NestedLinkResponse(NestedLinkResponseNestedItems nestedItems, NestedLinkResponseNestedNext nestedNext) {
        this.nestedItems = nestedItems;
        this.nestedNext = nestedNext;
    }

    /**
     * Get the nestedItems property: The nestedItems property.
     *
     * @return the nestedItems value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NestedLinkResponseNestedItems getNestedItems() {
        return this.nestedItems;
    }

    /**
     * Get the nestedNext property: The nestedNext property.
     *
     * @return the nestedNext value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NestedLinkResponseNestedNext getNestedNext() {
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
     * Reads an instance of NestedLinkResponse from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of NestedLinkResponse if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the NestedLinkResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static NestedLinkResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            NestedLinkResponseNestedItems nestedItems = null;
            NestedLinkResponseNestedNext nestedNext = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("nestedItems".equals(fieldName)) {
                    nestedItems = NestedLinkResponseNestedItems.fromJson(reader);
                } else if ("nestedNext".equals(fieldName)) {
                    nestedNext = NestedLinkResponseNestedNext.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            return new NestedLinkResponse(nestedItems, nestedNext);
        });
    }
}
