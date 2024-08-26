// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FluentLiveTests {

    private String className;
    private final Set<String> imports = new HashSet<>();
    private final Set<ExampleHelperFeature> helperFeatures = new HashSet<>();
    private final List<FluentLiveTestCase> testCases = new ArrayList<>();
    private ClassType managerType;
    private String managerName;

    public ClassType getManagerType() {
        return managerType;
    }


    public String getManagerName() {
        return managerName;
    }

    public String getClassName() {
        return className;
    }

    public Set<String> getImports() {
        return imports;
    }

    public Set<ExampleHelperFeature> getHelperFeatures() {
        return helperFeatures;
    }

    public List<FluentLiveTestCase> getTestCases() {
        return testCases;
    }

    public String getPackageName() {
        return JavaSettings.getInstance().getPackage("livetests");
    }

    public static Builder newBuilder() {
        return new Builder();
    }

    public static final class Builder {
        private String className;
        private final Set<String> imports = new HashSet<>();
        private final Set<ExampleHelperFeature> helperFeatures = new HashSet<>();
        private final List<FluentLiveTestCase> testCases = new ArrayList<>();
        private ClassType managerType;
        private String managerName;

        private Builder() {
        }

        public Builder className(String className) {
            this.className = className;
            return this;
        }

        public Builder addImports(Collection<String> imports) {
            if (!CoreUtils.isNullOrEmpty(imports)) {
                this.imports.addAll(imports);
            }
            return this;
        }

        public Builder addHelperFeatures(Collection<ExampleHelperFeature> helperFeatures) {
            if (!CoreUtils.isNullOrEmpty(helperFeatures)) {
                this.helperFeatures.addAll(helperFeatures);
            }
            return this;
        }

        public Builder addTestCases(Collection<FluentLiveTestCase> testCase) {
            if (testCase != null) {
                this.testCases.addAll(testCase);
            }
            return this;
        }

        public Builder managerType(ClassType managerType) {
            this.managerType = managerType;
            return this;
        }

        public Builder managerName(String managerName) {
            this.managerName = managerName;
            return this;
        }

        public FluentLiveTests build() {
            FluentLiveTests fluentLiveTests = new FluentLiveTests();
            fluentLiveTests.className = className;
            fluentLiveTests.managerType = managerType;
            fluentLiveTests.managerName = managerName;
            fluentLiveTests.testCases.addAll(this.testCases);
            fluentLiveTests.helperFeatures.addAll(this.helperFeatures);
            fluentLiveTests.imports.addAll(this.imports);
            return fluentLiveTests;
        }
    }
}
