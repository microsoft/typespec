// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.multipart.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import java.util.List;

/**
 * The BinaryArrayPartsRequest model.
 */
@Immutable
public final class BinaryArrayPartsRequest {
    /*
     * The id property.
     */
    @Generated
    private final String id;

    /*
     * The pictures property.
     */
    @Generated
    private final List<PicturesFileDetails> pictures;

    /**
     * Creates an instance of BinaryArrayPartsRequest class.
     * 
     * @param id the id value to set.
     * @param pictures the pictures value to set.
     */
    @Generated
    public BinaryArrayPartsRequest(String id, List<PicturesFileDetails> pictures) {
        this.id = id;
        this.pictures = pictures;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Generated
    public String getId() {
        return this.id;
    }

    /**
     * Get the pictures property: The pictures property.
     * 
     * @return the pictures value.
     */
    @Generated
    public List<PicturesFileDetails> getPictures() {
        return this.pictures;
    }
}
