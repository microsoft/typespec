package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The SpreadModelArrayRecord model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class SpreadModelArrayRecord implements JsonSerializable<SpreadModelArrayRecord> {
    /*
     * The knownProp property.
     */
    @Metadata(generated = true)
    private final List<ModelForRecord> knownProp;

    /*
     * Additional properties
     */
    @Metadata(generated = true)
    private Map<String, List<ModelForRecord>> additionalProperties;

    /**
     * Creates an instance of SpreadModelArrayRecord class.
     * 
     * @param knownProp the knownProp value to set.
     */
    @Metadata(generated = true)
    public SpreadModelArrayRecord(List<ModelForRecord> knownProp) {
        this.knownProp = knownProp;
    }

    /**
     * Get the knownProp property: The knownProp property.
     * 
     * @return the knownProp value.
     */
    @Metadata(generated = true)
    public List<ModelForRecord> getKnownProp() {
        return this.knownProp;
    }

    /**
     * Get the additionalProperties property: Additional properties.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, List<ModelForRecord>> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: Additional properties.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the SpreadModelArrayRecord object itself.
     */
    @Metadata(generated = true)
    public SpreadModelArrayRecord setAdditionalProperties(Map<String, List<ModelForRecord>> additionalProperties) {
        this.additionalProperties = additionalProperties;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("knownProp", this.knownProp, (writer, element) -> writer.writeJson(element));
        if (additionalProperties != null) {
            for (Map.Entry<String, List<ModelForRecord>> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadModelArrayRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadModelArrayRecord if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadModelArrayRecord.
     */
    @Metadata(generated = true)
    public static SpreadModelArrayRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<ModelForRecord> knownProp = null;
            Map<String, List<ModelForRecord>> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    List<ModelForRecord> additionalPropertiesArrayItem
                        = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                    additionalProperties.put(fieldName, additionalPropertiesArrayItem);
                }
            }
            SpreadModelArrayRecord deserializedSpreadModelArrayRecord = new SpreadModelArrayRecord(knownProp);
            deserializedSpreadModelArrayRecord.additionalProperties = additionalProperties;

            return deserializedSpreadModelArrayRecord;
        });
    }
}
