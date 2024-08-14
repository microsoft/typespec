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
 * Represents a choice value.
 */
public class ChoiceValue implements JsonSerializable<ChoiceValue> {
    private Languages language;
    private String value;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the ChoiceValue class.
     */
    public ChoiceValue() {
    }

    /**
     * Gets the language for the choice value. (Required)
     *
     * @return The language for the choice value.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language for the choice value. (Required)
     *
     * @param language The language for the choice value.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the value of the choice. (Required)
     *
     * @return The value of the choice.
     */
    public String getValue() {
        return value;
    }

    /**
     * Sets the value of the choice. (Required)
     *
     * @param value The value of the choice.
     */
    public void setValue(String value) {
        this.value = value;
    }

    /**
     * Gets the extensions for the choice value.
     *
     * @return The extensions for the choice value.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions for the choice value.
     *
     * @param extensions The extensions for the choice value.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return ChoiceValue.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[language="
            + Objects.toString(language, "<null>") + ",value=" + Objects.toString(value, "<null>") + ",extensions="
            + Objects.toString(extensions, "<null>") + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ChoiceValue)) {
            return false;
        }

        ChoiceValue rhs = ((ChoiceValue) other);
        return Objects.equals(this.value, rhs.value);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("language", language)
            .writeStringField("value", value)
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes a ChoiceValue instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ChoiceValue instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ChoiceValue fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ChoiceValue::new, (value, fieldName, reader) -> {
            if ("language".equals(fieldName)) {
                value.language = Languages.fromJson(reader);
            } else if ("value".equals(fieldName)) {
                value.value = reader.getString();
            } else if ("extensions".equals(fieldName)) {
                value.extensions = DictionaryAny.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
