// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Objects;

/**
 * Represents a serialization format.
 */
public class SerializationFormat implements JsonSerializable<SerializationFormat> {
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the SerializationFormat class.
     */
    public SerializationFormat() {
    }

    /**
     * Gets the extensions.
     *
     * @return The extensions.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions.
     *
     * @param extensions The extensions.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return SerializationFormat.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this))
            + "[extensions=" + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(extensions);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof SerializationFormat)) {
            return false;
        }

        SerializationFormat rhs = ((SerializationFormat) other);
        return Objects.equals(extensions, rhs.extensions);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes a SerializationFormat instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A SerializationFormat instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static SerializationFormat fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, SerializationFormat::new, (format, fieldName, reader) -> {
            if ("extensions".equals(fieldName)) {
                format.extensions = DictionaryAny.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
