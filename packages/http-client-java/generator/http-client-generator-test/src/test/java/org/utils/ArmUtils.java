// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package org.utils;

import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.policy.AddDatePolicy;
import com.azure.core.http.policy.AddHeadersFromContextPolicy;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.HttpLoggingPolicy;
import com.azure.core.http.policy.HttpPipelinePolicy;
import com.azure.core.http.policy.RequestIdPolicy;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.UserAgentPolicy;
import com.azure.core.management.AzureEnvironment;
import com.azure.core.management.profile.AzureProfile;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ArmUtils {

    private final static AzureProfile AZURE_PROFILE = new AzureProfile(
            "00000000-0000-0000-0000-000000000000",
            "00000000-0000-0000-0000-000000000000",
            new AzureEnvironment(Map.of("resourceManagerEndpointUrl", "http://localhost:3000")));

    private ArmUtils() {
    }

    public static HttpPipeline createTestHttpPipeline() {
        List<HttpPipelinePolicy> policies = new ArrayList<>();
        policies.add(new UserAgentPolicy());
        policies.add(new AddHeadersFromContextPolicy());
        policies.add(new RequestIdPolicy());
        policies.add(new RetryPolicy("Retry-After", ChronoUnit.SECONDS));
        policies.add(new AddDatePolicy());
        // no ArmChallengeAuthenticationPolicy
        policies.add(new HttpLoggingPolicy(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS)));
        return new HttpPipelineBuilder()
                .policies(policies.toArray(new HttpPipelinePolicy[0]))
                .build();
    }

    public static AzureProfile getAzureProfile() {
        return AZURE_PROFILE;
    }
}
