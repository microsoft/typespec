// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.versioning.renamedfrom.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;
import com.versioning.renamedfrom.NewInterfaceClient;
import com.versioning.renamedfrom.RenamedFromClient;
import com.versioning.renamedfrom.RenamedFromClientBuilder;

class RenamedFromClientTestBase extends TestProxyTestBase {
    protected RenamedFromClient renamedFromClient;

    protected NewInterfaceClient newInterfaceClient;

    @Override
    protected void beforeTest() {
        RenamedFromClientBuilder renamedFromClientbuilder = new RenamedFromClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .version(Configuration.getGlobalConfiguration().get("VERSION", "version"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            renamedFromClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        renamedFromClient = renamedFromClientbuilder.buildClient();

        RenamedFromClientBuilder newInterfaceClientbuilder = new RenamedFromClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .version(Configuration.getGlobalConfiguration().get("VERSION", "version"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            newInterfaceClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        newInterfaceClient = newInterfaceClientbuilder.buildNewInterfaceClient();

    }
}
