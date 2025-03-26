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
 * The model spread Record&lt;ModelForRecord[]&gt; with the different known property type.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public class DifferentSpreadModelArrayRecord implements JsonSerializable<DifferentSpreadModelArrayRecord> {
    /*
     * The knownProp property.
     */
    @Metadata(generated = true)
    private final String knownProp;

    /*
     * The model spread Record<ModelForRecord[]> with the different known property type
     */
    @Metadata(generated = true)
    private Map<String, List<ModelForRecord>> additionalProperties;

    /**
     * Creates an instance of DifferentSpreadModelArrayRecord class.
     * 
     * @param knownProp the knownProp value to set.
     */
    @Metadata(generated = true)
    public DifferentSpreadModelArrayRecord(String knownProp) {
        this.knownProp = knownProp;
    }

    /**
     * Get the knownProp property: The knownProp property.
     * 
     * @return the knownProp value.
     */
    @Metadata(generated = true)
    public String getKnownProp() {
        return this.knownProp;
    }

    /**
     * Get the additionalProperties property: The model spread Record&lt;ModelForRecord[]&gt; with the different known
     * property type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, List<ModelForRecord>> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model spread Record&lt;ModelForRecord[]&gt; with the different known
     * property type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the DifferentSpreadModelArrayRecord object itself.
     */
    @Metadata(generated = true)
    public DifferentSpreadModelArrayRecord
        setAdditionalProperties(Map<String, List<ModelForRecord>> additionalProperties) {
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
        jsonWriter.writeStringField("knownProp", this.knownProp);
        if (additionalProperties != null) {
            for (Map.Entry<String, List<ModelForRecord>> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DifferentSpreadModelArrayRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DifferentSpreadModelArrayRecord if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DifferentSpreadModelArrayRecord.
     */
    @Metadata(generated = true)
    public static DifferentSpreadModelArrayRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String knownProp = null;
            Map<String, List<ModelForRecord>> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = reader.getString();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    List<ModelForRecord> additionalPropertiesArrayItem
                        = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                    additionalProperties.put(fieldName, additionalPropertiesArrayItem);
                }
            }
            DifferentSpreadModelArrayRecord deserializedDifferentSpreadModelArrayRecord
                = new DifferentSpreadModelArrayRecord(knownProp);
            deserializedDifferentSpreadModelArrayRecord.additionalProperties = additionalProperties;

            return deserializedDifferentSpreadModelArrayRecord;
        });
    }
}
