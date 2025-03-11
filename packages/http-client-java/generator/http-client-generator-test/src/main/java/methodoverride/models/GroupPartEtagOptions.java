// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package methodoverride.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.core.util.DateTimeRfc1123;
import java.time.OffsetDateTime;

/**
 * The GroupPartEtagOptions model.
 */
@Fluent
public final class GroupPartEtagOptions {
    /*
     * The bar property.
     */
    @Generated
    private String bar;

    /*
     * The prop2 property.
     */
    @Generated
    private String prop2;

    /*
     * The If-Modified-Since property.
     */
    @Generated
    private DateTimeRfc1123 ifModifiedSince;

    /*
     * The If-Unmodified-Since property.
     */
    @Generated
    private DateTimeRfc1123 ifUnmodifiedSince;

    /*
     * The If-Match property.
     */
    @Generated
    private String ifMatch;

    /*
     * The If-None-Match property.
     */
    @Generated
    private String ifNoneMatch;

    /**
     * Creates an instance of GroupPartEtagOptions class.
     */
    @Generated
    public GroupPartEtagOptions() {
    }

    /**
     * Get the bar property: The bar property.
     * 
     * @return the bar value.
     */
    @Generated
    public String getBar() {
        return this.bar;
    }

    /**
     * Set the bar property: The bar property.
     * 
     * @param bar the bar value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setBar(String bar) {
        this.bar = bar;
        return this;
    }

    /**
     * Get the prop2 property: The prop2 property.
     * 
     * @return the prop2 value.
     */
    @Generated
    public String getProp2() {
        return this.prop2;
    }

    /**
     * Set the prop2 property: The prop2 property.
     * 
     * @param prop2 the prop2 value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setProp2(String prop2) {
        this.prop2 = prop2;
        return this;
    }

    /**
     * Get the ifModifiedSince property: The If-Modified-Since property.
     * 
     * @return the ifModifiedSince value.
     */
    @Generated
    public OffsetDateTime getIfModifiedSince() {
        if (this.ifModifiedSince == null) {
            return null;
        }
        return this.ifModifiedSince.getDateTime();
    }

    /**
     * Set the ifModifiedSince property: The If-Modified-Since property.
     * 
     * @param ifModifiedSince the ifModifiedSince value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setIfModifiedSince(OffsetDateTime ifModifiedSince) {
        if (ifModifiedSince == null) {
            this.ifModifiedSince = null;
        } else {
            this.ifModifiedSince = new DateTimeRfc1123(ifModifiedSince);
        }
        return this;
    }

    /**
     * Get the ifUnmodifiedSince property: The If-Unmodified-Since property.
     * 
     * @return the ifUnmodifiedSince value.
     */
    @Generated
    public OffsetDateTime getIfUnmodifiedSince() {
        if (this.ifUnmodifiedSince == null) {
            return null;
        }
        return this.ifUnmodifiedSince.getDateTime();
    }

    /**
     * Set the ifUnmodifiedSince property: The If-Unmodified-Since property.
     * 
     * @param ifUnmodifiedSince the ifUnmodifiedSince value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setIfUnmodifiedSince(OffsetDateTime ifUnmodifiedSince) {
        if (ifUnmodifiedSince == null) {
            this.ifUnmodifiedSince = null;
        } else {
            this.ifUnmodifiedSince = new DateTimeRfc1123(ifUnmodifiedSince);
        }
        return this;
    }

    /**
     * Get the ifMatch property: The If-Match property.
     * 
     * @return the ifMatch value.
     */
    @Generated
    public String getIfMatch() {
        return this.ifMatch;
    }

    /**
     * Set the ifMatch property: The If-Match property.
     * 
     * @param ifMatch the ifMatch value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setIfMatch(String ifMatch) {
        this.ifMatch = ifMatch;
        return this;
    }

    /**
     * Get the ifNoneMatch property: The If-None-Match property.
     * 
     * @return the ifNoneMatch value.
     */
    @Generated
    public String getIfNoneMatch() {
        return this.ifNoneMatch;
    }

    /**
     * Set the ifNoneMatch property: The If-None-Match property.
     * 
     * @param ifNoneMatch the ifNoneMatch value to set.
     * @return the GroupPartEtagOptions object itself.
     */
    @Generated
    public GroupPartEtagOptions setIfNoneMatch(String ifNoneMatch) {
        this.ifNoneMatch = ifNoneMatch;
        return this;
    }
}
