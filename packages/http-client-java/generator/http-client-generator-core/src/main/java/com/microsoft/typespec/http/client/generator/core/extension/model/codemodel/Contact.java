// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a contact.
 */
public class Contact {
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
        return Objects.equals(name, rhs.name)
            && Objects.equals(extensions, rhs.extensions)
            && Objects.equals(url, rhs.url)
            && Objects.equals(email, rhs.email);
    }
}
