// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package authentication.apikey.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import authentication.apikey.ApiKeyClient;
import authentication.apikey.ApiKeyClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class ApiKeyClientTestBase extends TestProxyTestBase {
    protected ApiKeyClient apiKeyClient;

    @Override
    protected void beforeTest() {
        ApiKeyClientBuilder apiKeyClientbuilder = new ApiKeyClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            apiKeyClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        apiKeyClient = apiKeyClientbuilder.buildClient();

    }
}
