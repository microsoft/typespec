// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package cadl.specialheaders.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import cadl.specialheaders.EtagHeadersClient;
import cadl.specialheaders.EtagHeadersOptionalBodyClient;
import cadl.specialheaders.RepeatabilityHeadersClient;
import cadl.specialheaders.SkipSpecialHeadersClient;
import cadl.specialheaders.SpecialHeadersClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;

class SpecialHeadersClientTestBase extends TestProxyTestBase {
    protected RepeatabilityHeadersClient repeatabilityHeadersClient;

    protected EtagHeadersClient etagHeadersClient;

    protected EtagHeadersOptionalBodyClient etagHeadersOptionalBodyClient;

    protected SkipSpecialHeadersClient skipSpecialHeadersClient;

    @Override
    protected void beforeTest() {
        SpecialHeadersClientBuilder repeatabilityHeadersClientbuilder = new SpecialHeadersClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            repeatabilityHeadersClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        repeatabilityHeadersClient = repeatabilityHeadersClientbuilder.buildRepeatabilityHeadersClient();

        SpecialHeadersClientBuilder etagHeadersClientbuilder = new SpecialHeadersClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            etagHeadersClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        etagHeadersClient = etagHeadersClientbuilder.buildEtagHeadersClient();

        SpecialHeadersClientBuilder etagHeadersOptionalBodyClientbuilder = new SpecialHeadersClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            etagHeadersOptionalBodyClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        etagHeadersOptionalBodyClient = etagHeadersOptionalBodyClientbuilder.buildEtagHeadersOptionalBodyClient();

        SpecialHeadersClientBuilder skipSpecialHeadersClientbuilder = new SpecialHeadersClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            skipSpecialHeadersClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        skipSpecialHeadersClient = skipSpecialHeadersClientbuilder.buildSkipSpecialHeadersClient();

    }
}
