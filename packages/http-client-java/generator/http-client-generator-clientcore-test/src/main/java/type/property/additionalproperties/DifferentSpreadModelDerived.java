package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model extends from a model that spread Record&lt;ModelForRecord&gt; with the different known property type.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DifferentSpreadModelDerived extends DifferentSpreadModelRecord {
    /*
     * The index property
     */
    @Metadata(generated = true)
    private final ModelForRecord derivedProp;

    /**
     * Creates an instance of DifferentSpreadModelDerived class.
     * 
     * @param knownProp the knownProp value to set.
     * @param derivedProp the derivedProp value to set.
     */
    @Metadata(generated = true)
    public DifferentSpreadModelDerived(String knownProp, ModelForRecord derivedProp) {
        super(knownProp);
        this.derivedProp = derivedProp;
    }

    /**
     * Get the derivedProp property: The index property.
     * 
     * @return the derivedProp value.
     */
    @Metadata(generated = true)
    public ModelForRecord getDerivedProp() {
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
        jsonWriter.writeJsonField("derivedProp", this.derivedProp);
        if (getAdditionalProperties() != null) {
            for (Map.Entry<String, ModelForRecord> additionalProperty : getAdditionalProperties().entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DifferentSpreadModelDerived from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DifferentSpreadModelDerived if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DifferentSpreadModelDerived.
     */
    @Metadata(generated = true)
    public static DifferentSpreadModelDerived fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String knownProp = null;
            ModelForRecord derivedProp = null;
            Map<String, ModelForRecord> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = reader.getString();
                } else if ("derivedProp".equals(fieldName)) {
                    derivedProp = ModelForRecord.fromJson(reader);
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, ModelForRecord.fromJson(reader));
                }
            }
            DifferentSpreadModelDerived deserializedDifferentSpreadModelDerived
                = new DifferentSpreadModelDerived(knownProp, derivedProp);
            deserializedDifferentSpreadModelDerived.setAdditionalProperties(additionalProperties);

            return deserializedDifferentSpreadModelDerived;
        });
    }
}
