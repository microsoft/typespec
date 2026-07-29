// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents a flag schema.
 */
public class FlagSchema extends ValueSchema {
    private List<FlagValue> choices = new ArrayList<>();

    /**
     * Creates a new instance of the FlagSchema class.
     */
    public FlagSchema() {
        super();
    }

    /**
     * Get the possible choices in the set. (Required)
     *
     * @return The possible choices in the set.
     */
    public List<FlagValue> getChoices() {
        return choices;
    }

    /**
     * Set the possible choices in the set. (Required)
     *
     * @param choices The possible choices in the set.
     */
    public void setChoices(List<FlagValue> choices) {
        this.choices = choices;
    }

    @Override
    public String toString() {
        return FlagSchema.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[choices="
            + choices + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(choices);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof FlagSchema)) {
            return false;
        }

        FlagSchema rhs = ((FlagSchema) other);
        return Objects.equals(choices, rhs.choices);
    }
}
