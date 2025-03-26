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
 * The model spread Record&lt;string&gt; with the different known property type.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public class DifferentSpreadStringRecord implements JsonSerializable<DifferentSpreadStringRecord> {
    /*
     * The name property
     */
    @Metadata(generated = true)
    private final double id;

    /*
     * The model spread Record<string> with the different known property type
     */
    @Metadata(generated = true)
    private Map<String, String> additionalProperties;

    /**
     * Creates an instance of DifferentSpreadStringRecord class.
     * 
     * @param id the id value to set.
     */
    @Metadata(generated = true)
    public DifferentSpreadStringRecord(double id) {
        this.id = id;
    }

    /**
     * Get the id property: The name property.
     * 
     * @return the id value.
     */
    @Metadata(generated = true)
    public double getId() {
        return this.id;
    }

    /**
     * Get the additionalProperties property: The model spread Record&lt;string&gt; with the different known property
     * type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, String> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model spread Record&lt;string&gt; with the different known property
     * type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the DifferentSpreadStringRecord object itself.
     */
    @Metadata(generated = true)
    public DifferentSpreadStringRecord setAdditionalProperties(Map<String, String> additionalProperties) {
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
            for (Map.Entry<String, String> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DifferentSpreadStringRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DifferentSpreadStringRecord if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DifferentSpreadStringRecord.
     */
    @Metadata(generated = true)
    public static DifferentSpreadStringRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            double id = 0.0;
            Map<String, String> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getDouble();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, reader.getString());
                }
            }
            DifferentSpreadStringRecord deserializedDifferentSpreadStringRecord = new DifferentSpreadStringRecord(id);
            deserializedDifferentSpreadStringRecord.additionalProperties = additionalProperties;

            return deserializedDifferentSpreadStringRecord;
        });
    }
}
