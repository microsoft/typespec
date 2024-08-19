// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentClientMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentCollectionMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceCreateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceUpdateExample;
import com.microsoft.typespec.http.client.generator.core.util.ClassNameUtil;

import java.util.ArrayList;
import java.util.List;

public class FluentExample implements Comparable<FluentExample> {

    private final String groupName;
    private final String methodName;
    private final String exampleName;

    private final List<FluentCollectionMethodExample> collectionMethodExamples = new ArrayList<>();
    private final List<FluentResourceCreateExample> resourceCreateExamples = new ArrayList<>();
    private final List<FluentResourceUpdateExample> resourceUpdateExamples = new ArrayList<>();

    private final List<FluentClientMethodExample> clientMethodExamples = new ArrayList<>();

    public FluentExample(String groupName, String methodName, String exampleName) {
        this.groupName = groupName;
        this.methodName = methodName;
        this.exampleName = exampleName;
    }

    public List<FluentCollectionMethodExample> getCollectionMethodExamples() {
        return collectionMethodExamples;
    }

    public List<FluentResourceCreateExample> getResourceCreateExamples() {
        return resourceCreateExamples;
    }

    public List<FluentResourceUpdateExample> getResourceUpdateExamples() {
        return resourceUpdateExamples;
    }

    public List<FluentClientMethodExample> getClientMethodExamples() {
        return clientMethodExamples;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getMethodName() {
        return methodName;
    }

    public String getPackageName() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage("generated");
    }

    public String getClassName() {
        String className = groupName + methodName + "Samples";
        return ClassNameUtil.truncateClassName(
                JavaSettings.getInstance().getPackage(), "src/samples/java",
                this.getPackageName(), className);
    }

    @Override
    public int compareTo(FluentExample o) {
        int ret = this.groupName.compareTo(o.groupName);
        if (ret == 0) {
            ret = this.methodName.compareTo(o.methodName);
        }
        if (ret == 0 && this.exampleName != null && o.exampleName != null) {
            ret = this.exampleName.compareTo(o.exampleName);
        }
        return ret;
    }
}
