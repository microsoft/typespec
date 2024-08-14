// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class LiveTestCase {

    private final String name;
    private final List<LiveTestStep> testSteps = new ArrayList<>();
    private final String description;

    public LiveTestCase(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public void addTestSteps(List<LiveTestStep> testSteps) {
        this.testSteps.addAll(testSteps);
    }

    public List<LiveTestStep> getTestSteps() {
        return Collections.unmodifiableList(testSteps);
    }

    public String getName() {
        return name;
    }
}
