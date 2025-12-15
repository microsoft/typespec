package documentation.lists.implementation;

import documentation.lists.BulletPointsModel;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The BulletPointsModelRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class BulletPointsModelRequest implements JsonSerializable<BulletPointsModelRequest> {
    /*
     * The input property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BulletPointsModel input;

    /**
     * Creates an instance of BulletPointsModelRequest class.
     * 
     * @param input the input value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BulletPointsModelRequest(BulletPointsModel input) {
        this.input = input;
    }

    /**
     * Get the input property: The input property.
     * 
     * @return the input value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BulletPointsModel getInput() {
        return this.input;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("input", this.input);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BulletPointsModelRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BulletPointsModelRequest if the JsonReader was pointing to an instance of it, or null if
     * it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the BulletPointsModelRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static BulletPointsModelRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BulletPointsModel input = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("input".equals(fieldName)) {
                    input = BulletPointsModel.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            return new BulletPointsModelRequest(input);
        });
    }
}
