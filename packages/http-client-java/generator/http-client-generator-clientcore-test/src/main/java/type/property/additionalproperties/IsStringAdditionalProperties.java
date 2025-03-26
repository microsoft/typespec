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
 * The model is from Record&lt;string&gt; type.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class IsStringAdditionalProperties implements JsonSerializable<IsStringAdditionalProperties> {
    /*
     * The name property
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * The model is from Record<string> type.
     */
    @Metadata(generated = true)
    private Map<String, String> additionalProperties;

    /**
     * Creates an instance of IsStringAdditionalProperties class.
     * 
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    public IsStringAdditionalProperties(String name) {
        this.name = name;
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Metadata(generated = true)
    public String getName() {
        return this.name;
    }

    /**
     * Get the additionalProperties property: The model is from Record&lt;string&gt; type.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, String> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model is from Record&lt;string&gt; type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the IsStringAdditionalProperties object itself.
     */
    @Metadata(generated = true)
    public IsStringAdditionalProperties setAdditionalProperties(Map<String, String> additionalProperties) {
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
        jsonWriter.writeStringField("name", this.name);
        if (additionalProperties != null) {
            for (Map.Entry<String, String> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IsStringAdditionalProperties from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of IsStringAdditionalProperties if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the IsStringAdditionalProperties.
     */
    @Metadata(generated = true)
    public static IsStringAdditionalProperties fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            Map<String, String> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName, reader.getString());
                }
            }
            IsStringAdditionalProperties deserializedIsStringAdditionalProperties
                = new IsStringAdditionalProperties(name);
            deserializedIsStringAdditionalProperties.additionalProperties = additionalProperties;

            return deserializedIsStringAdditionalProperties;
        });
    }
}
