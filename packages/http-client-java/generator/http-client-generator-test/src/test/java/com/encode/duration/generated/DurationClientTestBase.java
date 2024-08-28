// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.encode.duration.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import com.azure.core.http.HttpClient;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;
import com.encode.duration.DurationClientBuilder;
import com.encode.duration.HeaderClient;
import com.encode.duration.PropertyClient;
import com.encode.duration.QueryClient;

class DurationClientTestBase extends TestProxyTestBase {
    protected QueryClient queryClient;

    protected PropertyClient propertyClient;

    protected HeaderClient headerClient;

    @Override
    protected void beforeTest() {
        DurationClientBuilder queryClientbuilder = new DurationClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(HttpClient.createDefault())
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.PLAYBACK) {
            queryClientbuilder.httpClient(interceptorManager.getPlaybackClient());
        } else if (getTestMode() == TestMode.RECORD) {
            queryClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryClient = queryClientbuilder.buildQueryClient();

        DurationClientBuilder propertyClientbuilder = new DurationClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(HttpClient.createDefault())
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.PLAYBACK) {
            propertyClientbuilder.httpClient(interceptorManager.getPlaybackClient());
        } else if (getTestMode() == TestMode.RECORD) {
            propertyClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        propertyClient = propertyClientbuilder.buildPropertyClient();

        DurationClientBuilder headerClientbuilder = new DurationClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(HttpClient.createDefault())
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.PLAYBACK) {
            headerClientbuilder.httpClient(interceptorManager.getPlaybackClient());
        } else if (getTestMode() == TestMode.RECORD) {
            headerClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        headerClient = headerClientbuilder.buildHeaderClient();

    }
}
