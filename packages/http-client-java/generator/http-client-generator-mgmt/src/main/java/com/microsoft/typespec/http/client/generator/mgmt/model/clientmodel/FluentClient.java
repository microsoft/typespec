// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodMockUnitTest;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * Model for all Fluent lite related models.
 */
public class FluentClient {

    private final Client client;

    private FluentManager manager;

    private ModuleInfo moduleInfo;

    private final List<FluentResourceModel> resourceModels = new ArrayList<>();

    private final List<FluentResourceCollection> resourceCollections = new ArrayList<>();

    private final List<FluentExample> examples = new ArrayList<>();
    private final List<FluentMethodMockUnitTest> mockUnitTests = new ArrayList<>();

    private final List<FluentLiveTests> liveTests = new ArrayList<>();

    public FluentClient(Client client) {
        this.client = client;
    }

    public List<FluentResourceModel> getResourceModels() {
        return resourceModels;
    }

    public List<FluentResourceCollection> getResourceCollections() {
        return resourceCollections;
    }

    public FluentManager getManager() {
        return manager;
    }

    public void setManager(FluentManager manager) {
        this.manager = manager;
    }

    public Client getInnerClient() {
        return this.client;
    }

    public ModuleInfo getModuleInfo() {
        return moduleInfo;
    }

    public void setModuleInfo(ModuleInfo moduleInfo) {
        this.moduleInfo = moduleInfo;
    }

    public List<FluentExample> getExamples() {
        return examples;
    }

    public List<FluentMethodMockUnitTest> getMockUnitTests() {
        return mockUnitTests;
    }

    public List<FluentLiveTests> getLiveTests() {
        return liveTests;
    }
}
