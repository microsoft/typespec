package parameters.spread.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * The SpreadWithMultipleParametersRequest model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class SpreadWithMultipleParametersRequest
    implements JsonSerializable<SpreadWithMultipleParametersRequest> {
    /*
     * required string
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String requiredString;

    /*
     * optional int
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Integer optionalInt;

    /*
     * required int
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Integer> requiredIntList;

    /*
     * optional string
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<String> optionalStringList;

    /**
     * Creates an instance of SpreadWithMultipleParametersRequest class.
     * 
     * @param requiredString the requiredString value to set.
     * @param requiredIntList the requiredIntList value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadWithMultipleParametersRequest(String requiredString, List<Integer> requiredIntList) {
        this.requiredString = requiredString;
        this.requiredIntList = requiredIntList;
    }

    /**
     * Get the requiredString property: required string.
     * 
     * @return the requiredString value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getRequiredString() {
        return this.requiredString;
    }

    /**
     * Get the optionalInt property: optional int.
     * 
     * @return the optionalInt value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Integer getOptionalInt() {
        return this.optionalInt;
    }

    /**
     * Set the optionalInt property: optional int.
     * 
     * @param optionalInt the optionalInt value to set.
     * @return the SpreadWithMultipleParametersRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadWithMultipleParametersRequest setOptionalInt(Integer optionalInt) {
        this.optionalInt = optionalInt;
        return this;
    }

    /**
     * Get the requiredIntList property: required int.
     * 
     * @return the requiredIntList value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Integer> getRequiredIntList() {
        return this.requiredIntList;
    }

    /**
     * Get the optionalStringList property: optional string.
     * 
     * @return the optionalStringList value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<String> getOptionalStringList() {
        return this.optionalStringList;
    }

    /**
     * Set the optionalStringList property: optional string.
     * 
     * @param optionalStringList the optionalStringList value to set.
     * @return the SpreadWithMultipleParametersRequest object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadWithMultipleParametersRequest setOptionalStringList(List<String> optionalStringList) {
        this.optionalStringList = optionalStringList;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("requiredString", this.requiredString);
        jsonWriter.writeArrayField("requiredIntList", this.requiredIntList,
            (writer, element) -> writer.writeInt(element));
        jsonWriter.writeNumberField("optionalInt", this.optionalInt);
        jsonWriter.writeArrayField("optionalStringList", this.optionalStringList,
            (writer, element) -> writer.writeString(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadWithMultipleParametersRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadWithMultipleParametersRequest if the JsonReader was pointing to an instance of it,
     * or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadWithMultipleParametersRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SpreadWithMultipleParametersRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String requiredString = null;
            List<Integer> requiredIntList = null;
            Integer optionalInt = null;
            List<String> optionalStringList = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("requiredString".equals(fieldName)) {
                    requiredString = reader.getString();
                } else if ("requiredIntList".equals(fieldName)) {
                    requiredIntList = reader.readArray(reader1 -> reader1.getInt());
                } else if ("optionalInt".equals(fieldName)) {
                    optionalInt = reader.getNullable(JsonReader::getInt);
                } else if ("optionalStringList".equals(fieldName)) {
                    optionalStringList = reader.readArray(reader1 -> reader1.getString());
                } else {
                    reader.skipChildren();
                }
            }
            SpreadWithMultipleParametersRequest deserializedSpreadWithMultipleParametersRequest
                = new SpreadWithMultipleParametersRequest(requiredString, requiredIntList);
            deserializedSpreadWithMultipleParametersRequest.optionalInt = optionalInt;
            deserializedSpreadWithMultipleParametersRequest.optionalStringList = optionalStringList;

            return deserializedSpreadWithMultipleParametersRequest;
        });
    }
}
