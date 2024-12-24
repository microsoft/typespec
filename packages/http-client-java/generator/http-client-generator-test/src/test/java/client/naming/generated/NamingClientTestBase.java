// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package client.naming.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import client.naming.ClientModelClient;
import client.naming.NamingClient;
import client.naming.NamingClientBuilder;
import client.naming.UnionEnumClient;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class NamingClientTestBase extends TestProxyTestBase {
    protected NamingClient namingClient;

    protected ClientModelClient clientModelClient;

    protected UnionEnumClient unionEnumClient;

    @Override
    protected void beforeTest() {
        NamingClientBuilder namingClientbuilder = new NamingClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            namingClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        namingClient = namingClientbuilder.buildClient();

        NamingClientBuilder clientModelClientbuilder = new NamingClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            clientModelClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        clientModelClient = clientModelClientbuilder.buildClientModelClient();

        NamingClientBuilder unionEnumClientbuilder = new NamingClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            unionEnumClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        unionEnumClient = unionEnumClientbuilder.buildUnionEnumClient();

    }
}
