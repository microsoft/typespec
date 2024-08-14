// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;

import java.util.List;
import java.util.Objects;

public class TestContext<TExample> {

    private final List<ServiceClient> serviceClients;
    private final List<AsyncSyncClient> syncClients;

    private final TExample testCase;

    public TestContext(List<ServiceClient> serviceClients, List<AsyncSyncClient> syncClients) {
        this.serviceClients = Objects.requireNonNull(serviceClients);
        this.syncClients = Objects.requireNonNull(syncClients);
        this.testCase = null;
    }

    /**
     * Appends an example as test case to the test context.
     *
     * @param testContext test context
     * @param testCase an example as test case
     */
    public TestContext(TestContext testContext, TExample testCase) {
        this.serviceClients = Objects.requireNonNull(testContext.getServiceClients());
        this.syncClients = Objects.requireNonNull(testContext.getSyncClients());
        this.testCase = testCase;
    }

    public List<ServiceClient> getServiceClients() {
        return serviceClients;
    }

    public List<AsyncSyncClient> getSyncClients() {
        return syncClients;
    }

    public TExample getTestCase() {
        return testCase;
    }

    public String getPackageName() {
        return JavaSettings.getInstance().getPackage("generated");
    }

    public String getTestBaseClassName() {
        return serviceClients.iterator().next().getInterfaceName() + "TestBase";
    }
}
