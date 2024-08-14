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
 * Represents a reference to external documentation.
 */
public class ExternalDocumentation implements JsonSerializable<ExternalDocumentation> {
    private String description;
    private String url;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the ExternalDocumentation class.
     */
    public ExternalDocumentation() {
    }

    /**
     * Gets the description of the external documentation.
     *
     * @return The description of the external documentation.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the external documentation.
     *
     * @param description The description of the external documentation.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the URL of the external documentation.
     *
     * @return The URL of the external documentation.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the external documentation.
     *
     * @param url The URL of the external documentation.
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the extensions of the external documentation.
     *
     * @return The extensions of the external documentation.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the external documentation.
     *
     * @param extensions The extensions of the external documentation.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return ExternalDocumentation.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this))
            + "[description=" + Objects.toString(description, "<null>") + ",url=" + Objects.toString(url, "<null>")
            + ",extensions=" + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(description, extensions, url);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ExternalDocumentation)) {
            return false;
        }

        ExternalDocumentation rhs = ((ExternalDocumentation) other);
        return Objects.equals(description, rhs.description) && Objects.equals(url, rhs.url)
            && Objects.equals(extensions, rhs.extensions);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("description", description)
            .writeStringField("url", url)
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes an ExternalDocumentation instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An ExternalDocumentation instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ExternalDocumentation fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ExternalDocumentation::new, (documentation, fieldName, reader) -> {
            if ("description".equals(fieldName)) {
                documentation.description = reader.getString();
            } else if ("url".equals(fieldName)) {
                documentation.url = reader.getString();
            } else if ("extensions".equals(fieldName)) {
                documentation.extensions = DictionaryAny.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
