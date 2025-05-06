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
 * The model spread Record&lt;WidgetData2[] | WidgetData1&gt;.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class SpreadRecordForNonDiscriminatedUnion3
    implements JsonSerializable<SpreadRecordForNonDiscriminatedUnion3> {
    /*
     * The name property
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * The model spread Record<WidgetData2[] | WidgetData1>
     */
    @Metadata(generated = true)
    private Map<String, BinaryData> additionalProperties;

    /**
     * Creates an instance of SpreadRecordForNonDiscriminatedUnion3 class.
     * 
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    public SpreadRecordForNonDiscriminatedUnion3(String name) {
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
     * Get the additionalProperties property: The model spread Record&lt;WidgetData2[] | WidgetData1&gt;.
     * 
     * @return the additionalProperties value.
     */
    @Metadata(generated = true)
    public Map<String, BinaryData> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model spread Record&lt;WidgetData2[] | WidgetData1&gt;.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the SpreadRecordForNonDiscriminatedUnion3 object itself.
     */
    @Metadata(generated = true)
    public SpreadRecordForNonDiscriminatedUnion3 setAdditionalProperties(Map<String, BinaryData> additionalProperties) {
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
     * Reads an instance of SpreadRecordForNonDiscriminatedUnion3 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadRecordForNonDiscriminatedUnion3 if the JsonReader was pointing to an instance of it,
     * or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadRecordForNonDiscriminatedUnion3.
     */
    @Metadata(generated = true)
    public static SpreadRecordForNonDiscriminatedUnion3 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            Map<String, BinaryData> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    additionalProperties.put(fieldName,
                        reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped())));
                }
            }
            SpreadRecordForNonDiscriminatedUnion3 deserializedSpreadRecordForNonDiscriminatedUnion3
                = new SpreadRecordForNonDiscriminatedUnion3(name);
            deserializedSpreadRecordForNonDiscriminatedUnion3.additionalProperties = additionalProperties;

            return deserializedSpreadRecordForNonDiscriminatedUnion3;
        });
    }
}
