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
 * Represents a flag value.
 */
public class FlagValue implements JsonSerializable<FlagValue> {
    private Languages language;
    private double value;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the FlagValue class.
     */
    public FlagValue() {
    }

    /**
     * Gets the language of the flag value. (Required)
     *
     * @return The language of the flag value.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language of the flag value. (Required)
     *
     * @param language The language of the flag value.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the value of the flag. (Required)
     *
     * @return The value of the flag.
     */
    public double getValue() {
        return value;
    }

    /**
     * Sets the value of the flag. (Required)
     *
     * @param value The value of the flag.
     */
    public void setValue(double value) {
        this.value = value;
    }

    /**
     * Gets the extensions of the flag value.
     *
     * @return The extensions of the flag value.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the flag value.
     *
     * @param extensions The extensions of the flag value.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return FlagValue.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[language="
            + Objects.toString(language, "<null>") + ",value=" + value + ",extensions="
            + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(language, extensions, value);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof FlagValue)) {
            return false;
        }

        FlagValue rhs = ((FlagValue) other);
        return value == rhs.value && Objects.equals(language, rhs.language)
            && Objects.equals(extensions, rhs.extensions);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("language", language)
            .writeDoubleField("value", value)
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes a FlagValue instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A FlagValue instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static FlagValue fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, FlagValue::new, (value, fieldName, reader) -> {
            if ("language".equals(fieldName)) {
                value.language = Languages.fromJson(reader);
            } else if ("value".equals(fieldName)) {
                value.value = reader.getDouble();
            } else if ("extensions".equals(fieldName)) {
                value.extensions = DictionaryAny.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
