// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;

/**
 * Represents a header.
 */
public class Header {
    private String header;
    private Schema schema;
    private XmsExtensions extensions;
    private Languages language;

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

    public Languages getLanguage() {
        return language;
    }

    public void setLanguage(Languages language) {
        this.language = language;
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
}
