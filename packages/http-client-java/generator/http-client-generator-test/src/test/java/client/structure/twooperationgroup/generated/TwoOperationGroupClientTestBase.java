// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package client.structure.twooperationgroup.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import client.structure.twooperationgroup.Group1Client;
import client.structure.twooperationgroup.Group2Client;
import client.structure.twooperationgroup.TwoOperationGroupClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class TwoOperationGroupClientTestBase extends TestProxyTestBase {
    protected Group1Client group1Client;

    protected Group2Client group2Client;

    @Override
    protected void beforeTest() {
        TwoOperationGroupClientBuilder group1Clientbuilder = new TwoOperationGroupClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .client(Configuration.getGlobalConfiguration().get("CLIENT", "client"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            group1Clientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        group1Client = group1Clientbuilder.buildGroup1Client();

        TwoOperationGroupClientBuilder group2Clientbuilder = new TwoOperationGroupClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .client(Configuration.getGlobalConfiguration().get("CLIENT", "client"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            group2Clientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        group2Client = group2Clientbuilder.buildGroup2Client();

    }
}
