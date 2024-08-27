// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class ParameterExample {
    private final FluentMethod fluentMethod;
    private final List<ExampleNode> exampleNodes = new ArrayList<>();

    public ParameterExample(FluentMethod fluentMethod, Collection<ExampleNode> exampleNodeIterator) {
        this.fluentMethod = fluentMethod;
        exampleNodes.addAll(exampleNodeIterator);
    }

    public ParameterExample(FluentMethod fluentMethod, ExampleNode exampleNode) {
        this.fluentMethod = fluentMethod;
        if (exampleNode != null) {
            this.exampleNodes.add(exampleNode);
        }
    }

    public ParameterExample(ExampleNode exampleNode) {
        this.fluentMethod = null;
        if (exampleNode != null) {
            this.exampleNodes.add(exampleNode);
        }
    }

    public FluentMethod getFluentMethod() {
        return fluentMethod;
    }

    public List<ExampleNode> getExampleNodes() {
        return exampleNodes;
    }

    public ExampleNode getExampleNode() {
        return exampleNodes.isEmpty() ? null : exampleNodes.iterator().next();
    }
}
