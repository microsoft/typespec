package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The model extends from a type that extends from Record&lt;unknown&gt;.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class ExtendsUnknownAdditionalPropertiesDerived extends ExtendsUnknownAdditionalProperties {

    /*
     * The index property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int index;

    /*
     * The age property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Double age;

    /**
     * Creates an instance of ExtendsUnknownAdditionalPropertiesDerived class.
     *
     * @param name the name value to set.
     * @param index the index value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownAdditionalPropertiesDerived(String name, int index) {
        super(name);
        this.index = index;
    }

    /**
     * Get the index property: The index property.
     *
     * @return the index value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getIndex() {
        return this.index;
    }

    /**
     * Get the age property: The age property.
     *
     * @return the age value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Double getAge() {
        return this.age;
    }

    /**
     * Set the age property: The age property.
     *
     * @param age the age value to set.
     * @return the ExtendsUnknownAdditionalPropertiesDerived object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownAdditionalPropertiesDerived setAge(Double age) {
        this.age = age;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeIntField("index", this.index);
        jsonWriter.writeNumberField("age", this.age);
        if (getAdditionalProperties() != null) {
            for (Map.Entry<String, BinaryData> additionalProperty : getAdditionalProperties().entrySet()) {
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
     * Reads an instance of ExtendsUnknownAdditionalPropertiesDerived from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExtendsUnknownAdditionalPropertiesDerived if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ExtendsUnknownAdditionalPropertiesDerived.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ExtendsUnknownAdditionalPropertiesDerived fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            int index = 0;
            Double age = null;
            Map<String, BinaryData> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("index".equals(fieldName)) {
                    index = reader.getInt();
                } else if ("age".equals(fieldName)) {
                    age = reader.getNullable(JsonReader::getDouble);
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }
                    additionalProperties.put(fieldName,
                        reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped())));
                }
            }
            ExtendsUnknownAdditionalPropertiesDerived deserializedExtendsUnknownAdditionalPropertiesDerived
                = new ExtendsUnknownAdditionalPropertiesDerived(name, index);
            deserializedExtendsUnknownAdditionalPropertiesDerived.age = age;
            deserializedExtendsUnknownAdditionalPropertiesDerived.setAdditionalProperties(additionalProperties);
            return deserializedExtendsUnknownAdditionalPropertiesDerived;
        });
    }
}
