// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armresourceprovider.models;

import com.azure.core.annotation.Fluent;
import com.cadl.armresourceprovider.fluent.models.TopLevelArmResourceUpdateProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

/**
 * The type used for update operations of the TopLevelArmResource.
 */
@Fluent
public final class TopLevelArmResourceUpdate {
    /*
     * Resource tags.
     */
    @JsonProperty(value = "tags")
    @JsonInclude(value = JsonInclude.Include.NON_NULL, content = JsonInclude.Include.ALWAYS)
    private Map<String, String> tags;

    /*
     * The resource-specific properties for this resource.
     */
    @JsonProperty(value = "properties")
    private TopLevelArmResourceUpdateProperties innerProperties;

    /**
     * Creates an instance of TopLevelArmResourceUpdate class.
     */
    public TopLevelArmResourceUpdate() {
    }

    /**
     * Get the tags property: Resource tags.
     * 
     * @return the tags value.
     */
    public Map<String, String> tags() {
        return this.tags;
    }

    /**
     * Set the tags property: Resource tags.
     * 
     * @param tags the tags value to set.
     * @return the TopLevelArmResourceUpdate object itself.
     */
    public TopLevelArmResourceUpdate withTags(Map<String, String> tags) {
        this.tags = tags;
        return this;
    }

    /**
     * Get the innerProperties property: The resource-specific properties for this resource.
     * 
     * @return the innerProperties value.
     */
    private TopLevelArmResourceUpdateProperties innerProperties() {
        return this.innerProperties;
    }

    /**
     * Get the userName property: The userName property.
     * 
     * @return the userName value.
     */
    public String userName() {
        return this.innerProperties() == null ? null : this.innerProperties().userName();
    }

    /**
     * Set the userName property: The userName property.
     * 
     * @param userName the userName value to set.
     * @return the TopLevelArmResourceUpdate object itself.
     */
    public TopLevelArmResourceUpdate withUserName(String userName) {
        if (this.innerProperties() == null) {
            this.innerProperties = new TopLevelArmResourceUpdateProperties();
        }
        this.innerProperties().withUserName(userName);
        return this;
    }

    /**
     * Get the userNames property: The userNames property.
     * 
     * @return the userNames value.
     */
    public String userNames() {
        return this.innerProperties() == null ? null : this.innerProperties().userNames();
    }

    /**
     * Set the userNames property: The userNames property.
     * 
     * @param userNames the userNames value to set.
     * @return the TopLevelArmResourceUpdate object itself.
     */
    public TopLevelArmResourceUpdate withUserNames(String userNames) {
        if (this.innerProperties() == null) {
            this.innerProperties = new TopLevelArmResourceUpdateProperties();
        }
        this.innerProperties().withUserNames(userNames);
        return this;
    }

    /**
     * Get the accuserName property: The accuserName property.
     * 
     * @return the accuserName value.
     */
    public String accuserName() {
        return this.innerProperties() == null ? null : this.innerProperties().accuserName();
    }

    /**
     * Set the accuserName property: The accuserName property.
     * 
     * @param accuserName the accuserName value to set.
     * @return the TopLevelArmResourceUpdate object itself.
     */
    public TopLevelArmResourceUpdate withAccuserName(String accuserName) {
        if (this.innerProperties() == null) {
            this.innerProperties = new TopLevelArmResourceUpdateProperties();
        }
        this.innerProperties().withAccuserName(accuserName);
        return this;
    }

    /**
     * Validates the instance.
     * 
     * @throws IllegalArgumentException thrown if the instance is not valid.
     */
    public void validate() {
        if (innerProperties() != null) {
            innerProperties().validate();
        }
    }
}
