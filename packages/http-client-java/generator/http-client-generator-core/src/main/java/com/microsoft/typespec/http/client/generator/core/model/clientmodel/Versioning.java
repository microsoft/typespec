// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Collections;
import java.util.List;

public class Versioning {

    private final List<String> added;

    private Versioning(List<String> added) {
        this.added = added;
    }

    public List<String> getAdded() {
        return added;
    }

    public static class Builder {
        private List<String> added = Collections.emptyList();

        public Builder() {
        }

        public Builder added(List<String> added) {
            this.added = added;
            return this;
        }

        public Versioning build() {
            return new Versioning(added);
        }
    }
}
