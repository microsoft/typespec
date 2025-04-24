package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model spread Record&lt;string | float32&gt;.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class SpreadRecordForUnion implements JsonSerializable<SpreadRecordForUnion> {
    /*
     * The name property
     */
    @Metadata(generated = true)
    private final boolean flag;

    /*
     * The model spread Record<string | float32>
     */
    @Metadata(generated = true)
    private Map<String, BinaryData> additionalProperties;

    /**
     * Creates an instance of SpreadRecordForUnion class.
     * 
     * @param flag the flag value to set.
     */
    @Metadata(generated = true)
    public SpreadRecordForUnion(boolean flag) {
        this.flag = flag;
    }

    /**
     * Get the flag property: The name property.
     * 
     * @return the flag value.
     */
    @Metadata(generated = true)
    public boolean isFlag() {
        return this.flag;
    }

    /**
     * Get the additionalProperties property: The model spread Record&lt;string | float32&gt;.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, BinaryData> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model spread Record&lt;string | float32&gt;.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the SpreadRecordForUnion object itself.
     */
    @Metadata(generated = true)
    public SpreadRecordForUnion setAdditionalProperties(Map<String, BinaryData> additionalProperties) {
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
        jsonWriter.writeBooleanField("flag", this.flag);
        if (additionalProperties != null) {
            for (Map.Entry<String, BinaryData> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeFieldName(additionalProperty.getKey());
                if (additionalProperty.getValue() == null) {
                    jsonWriter.writeNull();
                } else {
                    additionalProperty.getValue().writeTo(jsonWriter);
                }
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadRecordForUnion from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadRecordForUnion if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadRecordForUnion.
     */
    @Metadata(generated = true)
    public static SpreadRecordForUnion fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            boolean flag = false;
            Map<String, BinaryData> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("flag".equals(fieldName)) {
                    flag = reader.getBoolean();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName,
                        reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped())));
                }
            }
            SpreadRecordForUnion deserializedSpreadRecordForUnion = new SpreadRecordForUnion(flag);
            deserializedSpreadRecordForUnion.additionalProperties = additionalProperties;

            return deserializedSpreadRecordForUnion;
        });
    }
}
