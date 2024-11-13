// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package parameters.basic.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;
import parameters.basic.BasicClientBuilder;
import parameters.basic.ExplicitBodyClient;
import parameters.basic.ImplicitBodyClient;

class BasicClientTestBase extends TestProxyTestBase {
    protected ExplicitBodyClient explicitBodyClient;

    protected ImplicitBodyClient implicitBodyClient;

    @Override
    protected void beforeTest() {
        BasicClientBuilder explicitBodyClientbuilder = new BasicClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            explicitBodyClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        explicitBodyClient = explicitBodyClientbuilder.buildExplicitBodyClient();

        BasicClientBuilder implicitBodyClientbuilder = new BasicClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            implicitBodyClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        implicitBodyClient = implicitBodyClientbuilder.buildImplicitBodyClient();

    }
}
