// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public abstract class LiveTestStep {

    protected String description;

    public String getDescription() {
        return description;
    }

    void setDescription(String description) {
        this.description = description;
    }

    public static abstract class Builder<S extends LiveTestStep, T extends Builder> {
        protected final S step;

        abstract protected T getThis();

        protected Builder(S step) {
            this.step = step;
        }

        public T description(String description) {
            step.setDescription(description);
            return getThis();
        }

        public S build() {
            return step;
        }
    }
}
