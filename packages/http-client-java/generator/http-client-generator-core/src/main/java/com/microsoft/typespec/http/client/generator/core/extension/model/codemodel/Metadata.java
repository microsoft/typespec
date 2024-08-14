// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents metadata.
 */
public class Metadata implements JsonSerializable<Metadata> {
    private Languages language;
    private Protocols protocol;
    private XmsExtensions extensions;

    /**
     * Creates a new instance of the Metadata class.
     */
    public Metadata() {
    }

    /**
     * Gets the language of the metadata. (Required)
     *
     * @return The language of the metadata.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language of the metadata. (Required)
     *
     * @param language The language of the metadata.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the protocol of the metadata. (Required)
     *
     * @return The protocol of the metadata.
     */
    public Protocols getProtocol() {
        return protocol;
    }

    /**
     * Sets the protocol of the metadata. (Required)
     *
     * @param protocol The protocol of the metadata.
     */
    public void setProtocol(Protocols protocol) {
        this.protocol = protocol;
    }

    /**
     * Gets the extensions of the metadata.
     *
     * @return The extensions of the metadata.
     */
    public XmsExtensions getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the metadata.
     *
     * @param extensions The extensions of the metadata.
     */
    public void setExtensions(XmsExtensions extensions) {
        this.extensions = extensions;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return writeParentProperties(jsonWriter.writeStartObject()).writeEndObject();
    }

    JsonWriter writeParentProperties(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeJsonField("language", language)
            .writeJsonField("protocol", protocol)
            .writeJsonField("extensions", extensions);
    }

    /**
     * Deserializes a Metadata instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Metadata instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Metadata fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Metadata::new, (metadata, fieldName, reader) -> {
            if (!metadata.tryConsumeParentProperties(metadata, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }

    boolean tryConsumeParentProperties(Metadata metadata, String fieldName, JsonReader reader) throws IOException {
        if ("language".equals(fieldName)) {
            metadata.language = Languages.fromJson(reader);
            return true;
        } else if ("protocol".equals(fieldName)) {
            metadata.protocol = Protocols.fromJson(reader);
            return true;
        } else if ("extensions".equals(fieldName)) {
            metadata.extensions = XmsExtensions.fromJson(reader);
            return true;
        }
        return false;
    }
}
