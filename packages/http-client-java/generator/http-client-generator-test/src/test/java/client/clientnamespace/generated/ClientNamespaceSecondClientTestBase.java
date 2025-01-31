// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package client.clientnamespace.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import client.clientnamespace.ClientNamespaceFirstClient;
import client.clientnamespace.ClientNamespaceFirstClientBuilder;
import client.clientnamespace.second.ClientNamespaceSecondClient;
import client.clientnamespace.second.ClientNamespaceSecondClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class ClientNamespaceSecondClientTestBase extends TestProxyTestBase {
    protected ClientNamespaceSecondClient clientNamespaceSecondClient;

    protected ClientNamespaceFirstClient clientNamespaceFirstClient;

    @Override
    protected void beforeTest() {
        ClientNamespaceSecondClientBuilder clientNamespaceSecondClientbuilder = new ClientNamespaceSecondClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            clientNamespaceSecondClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        clientNamespaceSecondClient = clientNamespaceSecondClientbuilder.buildClient();

        ClientNamespaceFirstClientBuilder clientNamespaceFirstClientbuilder = new ClientNamespaceFirstClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            clientNamespaceFirstClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        clientNamespaceFirstClient = clientNamespaceFirstClientbuilder.buildClient();

    }
}
