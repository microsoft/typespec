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
 * Represents a header.
 */
public class Header implements JsonSerializable<Header> {
    private String header;
    private Schema schema;
    private XmsExtensions extensions;

    /**
     * Creates a new instance of the Header class.
     */
    public Header() {
    }

    /**
     * Gets the name of the header.
     *
     * @return The name of the header.
     */
    public String getHeader() {
        return header;
    }

    /**
     * Sets the name of the header.
     *
     * @param header The name of the header.
     */
    public void setHeader(String header) {
        this.header = header;
    }

    /**
     * Gets the schema of the header.
     *
     * @return The schema of the header.
     */
    public Schema getSchema() {
        return schema;
    }

    /**
     * Sets the schema of the header.
     *
     * @param schema The schema of the header.
     */
    public void setSchema(Schema schema) {
        this.schema = schema;
    }

    /**
     * Gets the extensions of the header.
     *
     * @return The extensions of the header.
     */
    public XmsExtensions getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the header.
     *
     * @param extensions The extensions of the header.
     */
    public void setExtensions(XmsExtensions extensions) {
        this.extensions = extensions;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("header", header)
            .writeJsonField("schema", schema)
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes a Header instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Header instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Header fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Header::new, (header, fieldName, reader) -> {
            if ("header".equals(fieldName)) {
                header.header = reader.getString();
            } else if ("schema".equals(fieldName)) {
                header.schema = Schema.fromJson(reader);
            } else if ("extensions".equals(fieldName)) {
                header.extensions = XmsExtensions.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
