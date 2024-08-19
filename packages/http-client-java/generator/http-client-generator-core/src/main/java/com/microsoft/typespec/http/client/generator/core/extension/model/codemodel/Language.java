// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

import static com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils.readObject;

/**
 * Represents the per-language metadata.
 */
public class Language implements JsonSerializable<Language> {
    private String name;
    private String serializedName;
    private String description;
    private String summary;
    private String namespace;
    private String comment;

    /**
     * Creates a new instance of the Language class.
     */
    public Language() {
    }

    /**
     * Gets the name used in actual implementation. (Required)
     *
     * @return The name used in actual implementation.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name used in actual implementation. (Required)
     *
     * @param name The name used in actual implementation.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the serialized name.
     *
     * @return The serialized name.
     */
    public String getSerializedName() {
        return serializedName;
    }

    /**
     * Sets the serialized name.
     *
     * @param serializedName The serialized name.
     */
    public void setSerializedName(String serializedName) {
        this.serializedName = serializedName;
    }

    /**
     * Gets the description. (Required)
     *
     * @return The description.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description. (Required)
     *
     * @param description The description.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the summary.
     *
     * @return The summary.
     */
    public String getSummary() {
        return summary;
    }

    /**
     * Sets the summary.
     *
     * @param summary The summary.
     */
    public void setSummary(String summary) {
        this.summary = summary;
    }

    /**
     * Gets the namespace.
     *
     * @return The namespace.
     */
    public String getNamespace() {
        return namespace;
    }

    /**
     * Sets the namespace.
     *
     * @param namespace The namespace.
     */
    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    /**
     * Gets the comment.
     *
     * @return The comment.
     */
    public String getComment() {
        return comment;
    }

    /**
     * Sets the comment.
     *
     * @param comment The comment.
     */
    public void setComment(String comment) {
        this.comment = comment;
    }

    @Override
    public String toString() {
        return "Language{name='" + name + "', serializedName='" + serializedName + "'}";
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("name", name)
            .writeStringField("serializedName", serializedName)
            .writeStringField("description", description)
            .writeStringField("summary", summary)
            .writeStringField("namespace", namespace)
            .writeStringField("comment", comment)
            .writeEndObject();
    }

    /**
     * Deserializes a Language instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Language instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Language fromJson(JsonReader jsonReader) throws IOException {
        return readObject(jsonReader, Language::new, (language, fieldName, reader) -> {
            if ("name".equals(fieldName)) {
                language.name = reader.getString();
            } else if ("serializedName".equals(fieldName)) {
                language.serializedName = reader.getString();
            } else if ("description".equals(fieldName)) {
                language.description = reader.getString();
            } else if ("summary".equals(fieldName)) {
                language.summary = reader.getString();
            } else if ("namespace".equals(fieldName)) {
                language.namespace = reader.getString();
            } else if ("comment".equals(fieldName)) {
                language.comment = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
