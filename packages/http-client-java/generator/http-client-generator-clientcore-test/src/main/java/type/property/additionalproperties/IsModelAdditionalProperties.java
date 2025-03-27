package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model is from Record&lt;ModelForRecord&gt; type.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class IsModelAdditionalProperties implements JsonSerializable<IsModelAdditionalProperties> {
    /*
     * The knownProp property.
     */
    @Metadata(generated = true)
    private final ModelForRecord knownProp;

    /*
     * The model is from Record<ModelForRecord> type.
     */
    @Metadata(generated = true)
    private Map<String, ModelForRecord> additionalProperties;

    /**
     * Creates an instance of IsModelAdditionalProperties class.
     * 
     * @param knownProp the knownProp value to set.
     */
    @Metadata(generated = true)
    public IsModelAdditionalProperties(ModelForRecord knownProp) {
        this.knownProp = knownProp;
    }

    /**
     * Get the knownProp property: The knownProp property.
     * 
     * @return the knownProp value.
     */
    @Metadata(generated = true)
    public ModelForRecord getKnownProp() {
        return this.knownProp;
    }

    /**
     * Get the additionalProperties property: The model is from Record&lt;ModelForRecord&gt; type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, ModelForRecord> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model is from Record&lt;ModelForRecord&gt; type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the IsModelAdditionalProperties object itself.
     */
    @Metadata(generated = true)
    public IsModelAdditionalProperties setAdditionalProperties(Map<String, ModelForRecord> additionalProperties) {
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
        jsonWriter.writeJsonField("knownProp", this.knownProp);
        if (additionalProperties != null) {
            for (Map.Entry<String, ModelForRecord> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IsModelAdditionalProperties from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of IsModelAdditionalProperties if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the IsModelAdditionalProperties.
     */
    @Metadata(generated = true)
    public static IsModelAdditionalProperties fromJson(JsonReader jsonReader) throws IOException {
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
            IsModelAdditionalProperties deserializedIsModelAdditionalProperties
                = new IsModelAdditionalProperties(knownProp);
            deserializedIsModelAdditionalProperties.additionalProperties = additionalProperties;

            return deserializedIsModelAdditionalProperties;
        });
    }
}
