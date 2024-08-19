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
 * Represents a contact.
 */
public class Contact implements JsonSerializable<Contact> {
    private String name;
    private String url;
    private String email;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the Contact class.
     */
    public Contact() {
    }

    /**
     * Gets the name of the contact.
     *
     * @return The name of the contact.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the contact.
     *
     * @param name The name of the contact.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the URL of the contact.
     *
     * @return The URL of the contact.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the contact.
     *
     * @param url The URL of the contact.
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the email of the contact.
     *
     * @return The email of the contact.
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email of the contact.
     *
     * @param email The email of the contact.
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Gets the custom extensible metadata for individual language generators.
     *
     * @return The custom extensible metadata for individual language generators.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the custom extensible metadata for individual language generators.
     *
     * @param extensions The custom extensible metadata for individual language generators.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return Contact.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[name=" + name
            + ", url=" + url + ", email=" + email + ", extensions=" + extensions + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, extensions, url, email);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Contact)) {
            return false;
        }

        Contact rhs = ((Contact) other);
        return Objects.equals(name, rhs.name) && Objects.equals(extensions, rhs.extensions)
            && Objects.equals(url, rhs.url) && Objects.equals(email, rhs.email);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("name", name)
            .writeStringField("url", url)
            .writeStringField("email", email)
            .writeJsonField("extensions", extensions)
            .writeEndObject();
    }

    /**
     * Deserializes a Constant instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Constant instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Contact fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Contact::new, (contact, fieldName, reader) -> {
            if ("name".equals(fieldName)) {
                contact.name = reader.getString();
            } else if ("url".equals(fieldName)) {
                contact.url = reader.getString();
            } else if ("email".equals(fieldName)) {
                contact.email = reader.getString();
            } else if ("extensions".equals(fieldName)) {
                contact.extensions = DictionaryAny.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
