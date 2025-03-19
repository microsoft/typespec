// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package resiliency.servicedriven.v1.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;
import resiliency.servicedriven.v1.ResiliencyServiceDrivenClient;
import resiliency.servicedriven.v1.ResiliencyServiceDrivenClientBuilder;

class ResiliencyServiceDrivenClientTestBase extends TestProxyTestBase {
    protected ResiliencyServiceDrivenClient resiliencyServiceDrivenClient;

    @Override
    protected void beforeTest() {
        ResiliencyServiceDrivenClientBuilder resiliencyServiceDrivenClientbuilder
            = new ResiliencyServiceDrivenClientBuilder()
                .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "endpoint"))
                .serviceDeploymentVersion(
                    Configuration.getGlobalConfiguration().get("SERVICEDEPLOYMENTVERSION", "servicedeploymentversion"))
                .apiVersion(Configuration.getGlobalConfiguration().get("APIVERSION", "v1"))
                .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
                .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            resiliencyServiceDrivenClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        resiliencyServiceDrivenClient = resiliencyServiceDrivenClientbuilder.buildClient();

    }
}
