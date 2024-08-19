// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

public abstract class FluentLiveTestStep {

    private String description;

    public String getDescription() {
        return description;
    }

    void setDescription(String description) {
        this.description = description;
    }

    public static abstract class Builder<S extends FluentLiveTestStep, T extends Builder> {
        private final S step;

        abstract protected T getThis();

        protected Builder(S step) {
            this.step = step;
        }

        protected S getStep() {
            return step;
        }

        public T description(String description) {
            step.setDescription(description);
            return getThis();
        }

        public S build(){
            return step;
        }

    }

}
