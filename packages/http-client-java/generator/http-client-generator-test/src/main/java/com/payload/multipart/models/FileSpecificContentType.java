// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.payload.multipart.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.core.util.BinaryData;

/**
 * The file details for the "profileImage" field.
 */
@Immutable
public final class FileSpecificContentType {
    /*
     * The content of the file.
     */
    @Generated
    private final BinaryData content;

    /*
     * The filename of the file.
     */
    @Generated
    private final String filename;

    /*
     * The content-type of the file.
     */
    @Generated
    private final String contentType = "image/jpg";

    /**
     * Creates an instance of FileSpecificContentType class.
     * 
     * @param content the content value to set.
     * @param filename the filename value to set.
     */
    @Generated
    public FileSpecificContentType(BinaryData content, String filename) {
        this.content = content;
        this.filename = filename;
    }

    /**
     * Get the content property: The content of the file.
     * 
     * @return the content value.
     */
    @Generated
    public BinaryData getContent() {
        return this.content;
    }

    /**
     * Get the filename property: The filename of the file.
     * 
     * @return the filename value.
     */
    @Generated
    public String getFilename() {
        return this.filename;
    }

    /**
     * Get the contentType property: The content-type of the file.
     * 
     * @return the contentType value.
     */
    @Generated
    public String getContentType() {
        return this.contentType;
    }
}
