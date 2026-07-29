// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;

/**
 * Represents metadata.
 */
public class Metadata {
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
}
