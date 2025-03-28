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
 * The model extends from Record&lt;float32&gt; type.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class ExtendsFloatAdditionalProperties implements JsonSerializable<ExtendsFloatAdditionalProperties> {
    /*
     * The id property
     */
    @Metadata(generated = true)
    private final double id;

    /*
     * The model extends from Record<float32> type.
     */
    @Metadata(generated = true)
    private Map<String, Double> additionalProperties;

    /**
     * Creates an instance of ExtendsFloatAdditionalProperties class.
     * 
     * @param id the id value to set.
     */
    @Metadata(generated = true)
    public ExtendsFloatAdditionalProperties(double id) {
        this.id = id;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Metadata(generated = true)
    public double getId() {
        return this.id;
    }

    /**
     * Get the additionalProperties property: The model extends from Record&lt;float32&gt; type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, Double> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model extends from Record&lt;float32&gt; type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the ExtendsFloatAdditionalProperties object itself.
     */
    @Metadata(generated = true)
    public ExtendsFloatAdditionalProperties setAdditionalProperties(Map<String, Double> additionalProperties) {
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
        jsonWriter.writeDoubleField("id", this.id);
        if (additionalProperties != null) {
            for (Map.Entry<String, Double> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ExtendsFloatAdditionalProperties from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExtendsFloatAdditionalProperties if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ExtendsFloatAdditionalProperties.
     */
    @Metadata(generated = true)
    public static ExtendsFloatAdditionalProperties fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            double id = 0.0;
            Map<String, Double> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getDouble();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, reader.getDouble());
                }
            }
            ExtendsFloatAdditionalProperties deserializedExtendsFloatAdditionalProperties
                = new ExtendsFloatAdditionalProperties(id);
            deserializedExtendsFloatAdditionalProperties.additionalProperties = additionalProperties;

            return deserializedExtendsFloatAdditionalProperties;
        });
    }
}
