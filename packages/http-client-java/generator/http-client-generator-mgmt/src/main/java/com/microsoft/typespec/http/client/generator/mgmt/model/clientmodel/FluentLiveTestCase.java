// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FluentLiveTestCase {

    private final Set<ExampleHelperFeature> helperFeatures = new HashSet<>();
    private final List<FluentLiveTestStep> steps = new ArrayList<>();
    private String methodName;
    private String description;

    public static Builder newBuilder() {
        return new Builder();
    }

    public String getDescription() {
        return description;
    }

    public String getMethodName() {
        return methodName;
    }

    public Set<ExampleHelperFeature> getHelperFeatures() {
        return helperFeatures;
    }

    public List<FluentLiveTestStep> getSteps() {
        return steps;
    }

    public static final class Builder {
        private Set<ExampleHelperFeature> helperFeatures = new HashSet<>();
        private List<FluentLiveTestStep> steps = new ArrayList<>();
        private String methodName;
        private String description;

        private Builder() {
        }

        public Set<ExampleHelperFeature> getHelperFeatures(){
            return Collections.unmodifiableSet(this.helperFeatures);
        }

        public Builder addHelperFeatures(Set<ExampleHelperFeature> helperFeatures) {
            if (helperFeatures != null) {
                this.helperFeatures.addAll(helperFeatures);
            }
            return this;
        }

        public Builder addSteps(List<FluentLiveTestStep> steps) {
            if (steps != null) {
                this.steps.addAll(steps);
            }
            return this;
        }

        public Builder methodName(String methodName) {
            this.methodName = methodName;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public FluentLiveTestCase build() {
            FluentLiveTestCase fluentLiveTestCase = new FluentLiveTestCase();
            fluentLiveTestCase.steps.addAll(this.steps);
            fluentLiveTestCase.helperFeatures.addAll(this.helperFeatures);
            fluentLiveTestCase.description = this.description;
            fluentLiveTestCase.methodName = this.methodName;
            return fluentLiveTestCase;
        }
    }
}
