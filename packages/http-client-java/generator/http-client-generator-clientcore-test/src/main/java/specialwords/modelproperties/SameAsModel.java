package specialwords.modelproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The SameAsModel model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class SameAsModel implements JsonSerializable<SameAsModel> {
    /*
     * The SameAsModel property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String sameAsModel;

    /**
     * Creates an instance of SameAsModel class.
     * 
     * @param sameAsModel the sameAsModel value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SameAsModel(String sameAsModel) {
        this.sameAsModel = sameAsModel;
    }

    /**
     * Get the sameAsModel property: The SameAsModel property.
     * 
     * @return the sameAsModel value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getSameAsModel() {
        return this.sameAsModel;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("SameAsModel", this.sameAsModel);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SameAsModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SameAsModel if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SameAsModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SameAsModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String sameAsModel = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("SameAsModel".equals(fieldName)) {
                    sameAsModel = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new SameAsModel(sameAsModel);
        });
    }
}
