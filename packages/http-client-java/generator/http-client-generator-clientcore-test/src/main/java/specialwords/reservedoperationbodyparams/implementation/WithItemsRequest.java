package specialwords.reservedoperationbodyparams.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * The WithItemsRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class WithItemsRequest implements JsonSerializable<WithItemsRequest> {
    /*
     * The items property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<String> items;

    /**
     * Creates an instance of WithItemsRequest class.
     * 
     * @param items the items value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public WithItemsRequest(List<String> items) {
        this.items = items;
    }

    /**
     * Get the items property: The items property.
     * 
     * @return the items value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getItems() {
        return this.items;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("items", this.items, (writer, element) -> writer.writeString(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of WithItemsRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of WithItemsRequest if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the WithItemsRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static WithItemsRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<String> items = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("items".equals(fieldName)) {
                    items = reader.readArray(reader1 -> reader1.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new WithItemsRequest(items);
        });
    }
}
