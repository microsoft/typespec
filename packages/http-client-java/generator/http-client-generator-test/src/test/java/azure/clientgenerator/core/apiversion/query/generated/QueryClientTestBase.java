// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package azure.clientgenerator.core.apiversion.query.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import azure.clientgenerator.core.apiversion.query.QueryClient;
import azure.clientgenerator.core.apiversion.query.QueryClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class QueryClientTestBase extends TestProxyTestBase {
    protected QueryClient queryClient;

    @Override
    protected void beforeTest() {
        QueryClientBuilder queryClientbuilder = new QueryClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryClient = queryClientbuilder.buildClient();

    }
}
