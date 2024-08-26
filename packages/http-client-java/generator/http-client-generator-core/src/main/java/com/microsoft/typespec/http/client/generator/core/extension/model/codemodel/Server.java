// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.List;

/**
 * Represents a server.
 */
public class Server implements JsonSerializable<Server> {
    private String url;
    private Languages language;
    private List<Value> variables;

    /**
     * Creates a new instance of the Server class.
     */
    public Server() {
    }

    /**
     * Gets the URL of the server.
     *
     * @return The URL of the server.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the server.
     *
     * @param url The URL of the server.
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the language-specific information for the server.
     *
     * @return The language-specific information for the server.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language-specific information for the server.
     *
     * @param language The language-specific information for the server.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the variables for the server.
     *
     * @return The variables for the server.
     */
    public List<Value> getVariables() {
        return variables;
    }

    /**
     * Sets the variables for the server.
     *
     * @param variables The variables for the server.
     */
    public void setVariables(List<Value> variables) {
        this.variables = variables;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("url", url)
            .writeJsonField("language", language)
            .writeArrayField("variables", variables, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Server instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Server instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Server fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Server::new, (server, fieldName, reader) -> {
            if ("url".equals(fieldName)) {
                server.url = reader.getString();
            } else if ("language".equals(fieldName)) {
                server.language = Languages.fromJson(reader);
            } else if ("variables".equals(fieldName)) {
                server.variables = reader.readArray(Value::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
