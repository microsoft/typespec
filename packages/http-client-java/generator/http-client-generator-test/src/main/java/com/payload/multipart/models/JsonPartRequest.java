// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.payload.multipart.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;

/**
 * The JsonPartRequest model.
 */
@Immutable
public final class JsonPartRequest {
    /*
     * The address property.
     */
    @Generated
    private final Address address;

    /*
     * The profileImage property.
     */
    @Generated
    private final ProfileImageFileDetails profileImage;

    /**
     * Creates an instance of JsonPartRequest class.
     * 
     * @param address the address value to set.
     * @param profileImage the profileImage value to set.
     */
    @Generated
    public JsonPartRequest(Address address, ProfileImageFileDetails profileImage) {
        this.address = address;
        this.profileImage = profileImage;
    }

    /**
     * Get the address property: The address property.
     * 
     * @return the address value.
     */
    @Generated
    public Address getAddress() {
        return this.address;
    }

    /**
     * Get the profileImage property: The profileImage property.
     * 
     * @return the profileImage value.
     */
    @Generated
    public ProfileImageFileDetails getProfileImage() {
        return this.profileImage;
    }
}
