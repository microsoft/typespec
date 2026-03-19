package encode.array;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The CommaDelimitedExtensibleEnumArrayProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class CommaDelimitedExtensibleEnumArrayProperty
    implements JsonSerializable<CommaDelimitedExtensibleEnumArrayProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<ColorsExtensibleEnum> value;

    /**
     * Creates an instance of CommaDelimitedExtensibleEnumArrayProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CommaDelimitedExtensibleEnumArrayProperty(List<ColorsExtensibleEnum> value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<ColorsExtensibleEnum> getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (this.value != null) {
            jsonWriter.writeStringField("value",
                this.value.stream()
                    .map(element -> element == null ? null : element.getValue())
                    .collect(Collectors.joining(",")));
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CommaDelimitedExtensibleEnumArrayProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CommaDelimitedExtensibleEnumArrayProperty if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CommaDelimitedExtensibleEnumArrayProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static CommaDelimitedExtensibleEnumArrayProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<ColorsExtensibleEnum> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> {
                        String valueEncodedAsString = nonNullReader.getString();
                        return valueEncodedAsString.isEmpty()
                            ? new LinkedList<>()
                            : new LinkedList<>(Arrays.stream(valueEncodedAsString.split(",", -1))
                                .map(valueAsString -> valueAsString == null
                                    ? null
                                    : ColorsExtensibleEnum.fromValue(valueAsString))
                                .collect(Collectors.toList()));
                    });
                } else {
                    reader.skipChildren();
                }
            }
            return new CommaDelimitedExtensibleEnumArrayProperty(value);
        });
    }
}
