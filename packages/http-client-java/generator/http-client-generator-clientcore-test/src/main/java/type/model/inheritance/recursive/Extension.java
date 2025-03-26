package type.model.inheritance.recursive;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * extension.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class Extension extends Element {
    /*
     * The level property.
     */
    @Metadata(generated = true)
    private final int level;

    /**
     * Creates an instance of Extension class.
     * 
     * @param level the level value to set.
     */
    @Metadata(generated = true)
    public Extension(int level) {
        this.level = level;
    }

    /**
     * Get the level property: The level property.
     * 
     * @return the level value.
     */
    @Metadata(generated = true)
    public int getLevel() {
        return this.level;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public Extension setExtension(List<Extension> extension) {
        super.setExtension(extension);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("extension", getExtension(), (writer, element) -> writer.writeJson(element));
        jsonWriter.writeIntField("level", this.level);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Extension from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Extension if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Extension.
     */
    @Metadata(generated = true)
    public static Extension fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Extension> extension = null;
            int level = 0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("extension".equals(fieldName)) {
                    extension = reader.readArray(reader1 -> Extension.fromJson(reader1));
                } else if ("level".equals(fieldName)) {
                    level = reader.getInt();
                } else {
                    reader.skipChildren();
                }
            }
            Extension deserializedExtension = new Extension(level);
            deserializedExtension.setExtension(extension);

            return deserializedExtension;
        });
    }
}
