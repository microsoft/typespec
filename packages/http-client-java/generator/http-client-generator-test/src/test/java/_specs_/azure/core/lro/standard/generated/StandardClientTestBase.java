// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package _specs_.azure.core.lro.standard.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import _specs_.azure.core.lro.standard.StandardClient;
import _specs_.azure.core.lro.standard.StandardClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class StandardClientTestBase extends TestProxyTestBase {
    protected StandardClient standardClient;

    @Override
    protected void beforeTest() {
        StandardClientBuilder standardClientbuilder = new StandardClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            standardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        standardClient = standardClientbuilder.buildClient();

    }
}
