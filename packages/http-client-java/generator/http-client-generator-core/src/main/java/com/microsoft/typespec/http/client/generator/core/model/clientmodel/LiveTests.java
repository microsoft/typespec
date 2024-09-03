// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class LiveTests {

    private final String filename;
    private final List<LiveTestCase> testCases = new ArrayList<>();

    public LiveTests(String filename) {
        this.filename = filename;
    }

    public String getFilename() {
        return filename;
    }

    public List<LiveTestCase> getTestCases() {
        return Collections.unmodifiableList(testCases);
    }

    public void addTestCases(List<LiveTestCase> testCases){
        if (testCases != null) {
            this.testCases.addAll(testCases);
        }
    }

}
