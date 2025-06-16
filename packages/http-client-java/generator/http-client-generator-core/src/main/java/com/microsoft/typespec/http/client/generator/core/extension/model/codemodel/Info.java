// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents code model info.
 */
public class Info {
    private String title;
    private String description;
    private String termsOfService;
    private Contact contact;
    private License license;
    private ExternalDocumentation externalDocs;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the Info class.
     */
    public Info() {
    }

    /**
     * Gets the title of the service. (Required)
     *
     * @return The title of the service.
     */
    public String getTitle() {
        return title;
    }

    /**
     * Sets the title of the service. (Required)
     *
     * @param title The title of the service.
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Gets the description of the service.
     *
     * @return The description of the service.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the service.
     *
     * @param description The description of the service.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the URL of the terms of service.
     *
     * @return The URL of the terms of service.
     */
    public String getTermsOfService() {
        return termsOfService;
    }

    /**
     * Sets the URL of the terms of service.
     *
     * @param termsOfService The URL of the terms of service.
     */
    public void setTermsOfService(String termsOfService) {
        this.termsOfService = termsOfService;
    }

    /**
     * Gets the contact information.
     *
     * @return The contact information.
     */
    public Contact getContact() {
        return contact;
    }

    /**
     * Sets the contact information.
     *
     * @param contact The contact information.
     */
    public void setContact(Contact contact) {
        this.contact = contact;
    }

    /**
     * Gets the license information.
     *
     * @return The license information.
     */
    public License getLicense() {
        return license;
    }

    /**
     * Sets the license information.
     *
     * @param license The license information.
     */
    public void setLicense(License license) {
        this.license = license;
    }

    /**
     * Gets the reference to external documentation.
     *
     * @return The reference to external documentation.
     */
    public ExternalDocumentation getExternalDocs() {
        return externalDocs;
    }

    /**
     * Sets the reference to external documentation.
     *
     * @param externalDocs The reference to external documentation.
     */
    public void setExternalDocs(ExternalDocumentation externalDocs) {
        this.externalDocs = externalDocs;
    }

    /**
     * Gets the extensions of the service.
     *
     * @return The extensions of the service.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the service.
     *
     * @param extensions The extensions of the service.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return Info.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[title="
            + Objects.toString(title, "<null>") + ",description=" + Objects.toString(description, "<null>")
            + ",termsOfService=" + Objects.toString(termsOfService, "<null>") + ",contact="
            + Objects.toString(contact, "<null>") + ",license=" + Objects.toString(license, "<null>") + ",externalDocs="
            + Objects.toString(externalDocs, "<null>") + ",extensions=" + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(license, extensions, contact, description, termsOfService, externalDocs, title);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Info)) {
            return false;
        }

        Info rhs = ((Info) other);
        return Objects.equals(title, rhs.title)
            && Objects.equals(description, rhs.description)
            && Objects.equals(termsOfService, rhs.termsOfService)
            && Objects.equals(contact, rhs.contact)
            && Objects.equals(license, rhs.license)
            && Objects.equals(externalDocs, rhs.externalDocs)
            && Objects.equals(extensions, rhs.extensions);
    }
}
