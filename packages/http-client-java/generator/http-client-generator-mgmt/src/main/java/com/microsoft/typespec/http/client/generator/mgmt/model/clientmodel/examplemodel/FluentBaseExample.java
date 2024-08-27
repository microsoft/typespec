// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;

import java.util.ArrayList;
import java.util.List;

public abstract class FluentBaseExample implements FluentExample {

    private final String name;
    private final String originalFileName;
    private final FluentManager manager;
    private final FluentResourceCollection collection;
    private final List<ParameterExample> parameters = new ArrayList<>();

    public FluentBaseExample(String name, String originalFileName,
                             FluentManager manager, FluentResourceCollection collection) {
        this.name = name;
        this.originalFileName = originalFileName;
        this.manager = manager;
        this.collection = collection;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getOriginalFileName() {
        return originalFileName;
    }

    public FluentManager getManager() {
        return manager;
    }


    @Override
    public ClassType getEntryType() {
        return manager.getType();
    }

    @Override
    public String getEntryName() {
        return "manager";
    }

    @Override
    public String getEntryDescription() {
        return String.format("Entry point to %1$s.", manager.getType().getName());
    }

    public FluentResourceCollection getResourceCollection() {
        return collection;
    }

    @Override
    public List<ParameterExample> getParameters() {
        return parameters;
    }
}
