package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The model extends from a model that spread Record&lt;ModelForRecord[]&gt; with the different known property type.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DifferentSpreadModelArrayDerived extends DifferentSpreadModelArrayRecord {
    /*
     * The index property
     */
    @Metadata(generated = true)
    private final List<ModelForRecord> derivedProp;

    /**
     * Creates an instance of DifferentSpreadModelArrayDerived class.
     * 
     * @param knownProp the knownProp value to set.
     * @param derivedProp the derivedProp value to set.
     */
    @Metadata(generated = true)
    public DifferentSpreadModelArrayDerived(String knownProp, List<ModelForRecord> derivedProp) {
        super(knownProp);
        this.derivedProp = derivedProp;
    }

    /**
     * Get the derivedProp property: The index property.
     * 
     * @return the derivedProp value.
     */
    @Metadata(generated = true)
    public List<ModelForRecord> getDerivedProp() {
        return this.derivedProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("knownProp", getKnownProp());
        jsonWriter.writeArrayField("derivedProp", this.derivedProp, (writer, element) -> writer.writeJson(element));
        if (getAdditionalProperties() != null) {
            for (Map.Entry<String, List<ModelForRecord>> additionalProperty : getAdditionalProperties().entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DifferentSpreadModelArrayDerived from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DifferentSpreadModelArrayDerived if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DifferentSpreadModelArrayDerived.
     */
    @Metadata(generated = true)
    public static DifferentSpreadModelArrayDerived fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String knownProp = null;
            List<ModelForRecord> derivedProp = null;
            Map<String, List<ModelForRecord>> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = reader.getString();
                } else if ("derivedProp".equals(fieldName)) {
                    derivedProp = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    List<ModelForRecord> additionalPropertiesArrayItem
                        = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                    additionalProperties.put(fieldName, additionalPropertiesArrayItem);
                }
            }
            DifferentSpreadModelArrayDerived deserializedDifferentSpreadModelArrayDerived
                = new DifferentSpreadModelArrayDerived(knownProp, derivedProp);
            deserializedDifferentSpreadModelArrayDerived.setAdditionalProperties(additionalProperties);

            return deserializedDifferentSpreadModelArrayDerived;
        });
    }
}
