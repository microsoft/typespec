package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model spread Record&lt;ModelForRecord&gt; with the same known property type.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class SpreadModelRecord implements JsonSerializable<SpreadModelRecord> {
    /*
     * The knownProp property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ModelForRecord knownProp;

    /*
     * The model spread Record<ModelForRecord> with the same known property type
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Map<String, ModelForRecord> additionalProperties;

    /**
     * Creates an instance of SpreadModelRecord class.
     * 
     * @param knownProp the knownProp value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelRecord(ModelForRecord knownProp) {
        this.knownProp = knownProp;
    }

    /**
     * Get the knownProp property: The knownProp property.
     * 
     * @return the knownProp value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelForRecord getKnownProp() {
        return this.knownProp;
    }

    /**
     * Get the additionalProperties property: The model spread Record&lt;ModelForRecord&gt; with the same known property
     * type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Map<String, ModelForRecord> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model spread Record&lt;ModelForRecord&gt; with the same known property
     * type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the SpreadModelRecord object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelRecord setAdditionalProperties(Map<String, ModelForRecord> additionalProperties) {
        this.additionalProperties = additionalProperties;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("knownProp", this.knownProp);
        if (additionalProperties != null) {
            for (Map.Entry<String, ModelForRecord> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadModelRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadModelRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadModelRecord.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SpreadModelRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            ModelForRecord knownProp = null;
            Map<String, ModelForRecord> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = ModelForRecord.fromJson(reader);
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, ModelForRecord.fromJson(reader));
                }
            }
            SpreadModelRecord deserializedSpreadModelRecord = new SpreadModelRecord(knownProp);
            deserializedSpreadModelRecord.additionalProperties = additionalProperties;

            return deserializedSpreadModelRecord;
        });
    }
}
