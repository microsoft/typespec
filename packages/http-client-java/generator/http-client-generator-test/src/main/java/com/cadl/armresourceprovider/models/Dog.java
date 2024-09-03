// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armresourceprovider.models;

import com.azure.core.annotation.Fluent;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeId;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

/**
 * Test extensible enum type for discriminator.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind", defaultImpl = Dog.class, visible = true)
@JsonTypeName("Dog")
@JsonSubTypes({ @JsonSubTypes.Type(name = "golden_dog", value = Golden.class) })
@Fluent
public class Dog {
    /*
     * discriminator property
     */
    @JsonTypeId
    @JsonProperty(value = "kind", required = true)
    DogKind kind;

    /*
     * Weight of the dog
     */
    @JsonProperty(value = "weight", required = true)
    private int weight;

    /**
     * Creates an instance of Dog class.
     */
    public Dog() {
        this.kind = DogKind.fromString("Dog");
    }

    /**
     * Get the kind property: discriminator property.
     * 
     * @return the kind value.
     */
    public DogKind kind() {
        return this.kind;
    }

    /**
     * Get the weight property: Weight of the dog.
     * 
     * @return the weight value.
     */
    public int weight() {
        return this.weight;
    }

    /**
     * Set the weight property: Weight of the dog.
     * 
     * @param weight the weight value to set.
     * @return the Dog object itself.
     */
    public Dog withWeight(int weight) {
        this.weight = weight;
        return this;
    }

    /**
     * Validates the instance.
     * 
     * @throws IllegalArgumentException thrown if the instance is not valid.
     */
    public void validate() {
    }
}
