// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armresourceprovider.models;

import com.azure.core.util.ExpandableEnum;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.lang.IllegalArgumentException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Defines values for PriorityModel.
 */
public final class PriorityModel implements ExpandableEnum<Integer> {
    private static final Map<Integer, PriorityModel> VALUES = new ConcurrentHashMap<>();

    /**
     * Static value 0 for PriorityModel.
     */
    public static final PriorityModel HIGH = fromValue(0);

    /**
     * Static value 1 for PriorityModel.
     */
    public static final PriorityModel LOW = fromValue(1);

    private final Integer value;

    private PriorityModel(Integer value) {
        this.value = value;
    }

    /**
     * Creates or finds a PriorityModel.
     * 
     * @param value a value to look for.
     * @return the corresponding PriorityModel.
     */
    @JsonCreator
    public static PriorityModel fromValue(Integer value) {
        if (value == null) {
            throw new IllegalArgumentException("value can't be null");
        }
        PriorityModel member = VALUES.get(value);
        if (member != null) {
            return member;
        }
        return VALUES.computeIfAbsent(value, key -> new PriorityModel(key));
    }

    /**
     * Gets known PriorityModel values.
     * 
     * @return Known PriorityModel values.
     */
    public static Collection<PriorityModel> values() {
        return new ArrayList<>(VALUES.values());
    }

    /**
     * Gets the value of the PriorityModel instance.
     * 
     * @return the value of the PriorityModel instance.
     */
    @Override
    public Integer getValue() {
        return this.value;
    }

    @Override
    public String toString() {
        return getValue().toString();
    }

    @Override
    public boolean equals(Object obj) {
        return (obj instanceof PriorityModel) && ((PriorityModel) obj).getValue().equals(getValue());
    }

    @Override
    public int hashCode() {
        return getValue().hashCode();
    }
}
