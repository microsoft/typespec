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
 * The model extends from a model that spread Record&lt;float32&gt; with the different known property type.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DifferentSpreadFloatDerived extends DifferentSpreadFloatRecord {
    /*
     * The index property
     */
    @Metadata(generated = true)
    private final double derivedProp;

    /**
     * Creates an instance of DifferentSpreadFloatDerived class.
     * 
     * @param name the name value to set.
     * @param derivedProp the derivedProp value to set.
     */
    @Metadata(generated = true)
    public DifferentSpreadFloatDerived(String name, double derivedProp) {
        super(name);
        this.derivedProp = derivedProp;
    }

    /**
     * Get the derivedProp property: The index property.
     * 
     * @return the derivedProp value.
     */
    @Metadata(generated = true)
    public double getDerivedProp() {
        return this.derivedProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeDoubleField("derivedProp", this.derivedProp);
        if (getAdditionalProperties() != null) {
            for (Map.Entry<String, Double> additionalProperty : getAdditionalProperties().entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DifferentSpreadFloatDerived from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DifferentSpreadFloatDerived if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DifferentSpreadFloatDerived.
     */
    @Metadata(generated = true)
    public static DifferentSpreadFloatDerived fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            double derivedProp = 0.0;
            Map<String, Double> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("derivedProp".equals(fieldName)) {
                    derivedProp = reader.getDouble();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, reader.getDouble());
                }
            }
            DifferentSpreadFloatDerived deserializedDifferentSpreadFloatDerived
                = new DifferentSpreadFloatDerived(name, derivedProp);
            deserializedDifferentSpreadFloatDerived.setAdditionalProperties(additionalProperties);

            return deserializedDifferentSpreadFloatDerived;
        });
    }
}
