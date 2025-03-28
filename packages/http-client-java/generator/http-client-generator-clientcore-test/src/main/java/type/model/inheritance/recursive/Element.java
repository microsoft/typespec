package type.model.inheritance.recursive;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * element.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public class Element implements JsonSerializable<Element> {
    /*
     * The extension property.
     */
    @Metadata(generated = true)
    private List<Extension> extension;

    /**
     * Creates an instance of Element class.
     */
    @Metadata(generated = true)
    public Element() {
    }

    /**
     * Get the extension property: The extension property.
     * 
     * @return the extension value.
     */
    @Metadata(generated = true)
    public List<Extension> getExtension() {
        return this.extension;
    }

    /**
     * Set the extension property: The extension property.
     * 
     * @param extension the extension value to set.
     * @return the Element object itself.
     */
    @Metadata(generated = true)
    public Element setExtension(List<Extension> extension) {
        this.extension = extension;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("extension", this.extension, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Element from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Element if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IOException If an error occurs while reading the Element.
     */
    @Metadata(generated = true)
    public static Element fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Element deserializedElement = new Element();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("extension".equals(fieldName)) {
                    List<Extension> extension = reader.readArray(reader1 -> Extension.fromJson(reader1));
                    deserializedElement.extension = extension;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedElement;
        });
    }
}
