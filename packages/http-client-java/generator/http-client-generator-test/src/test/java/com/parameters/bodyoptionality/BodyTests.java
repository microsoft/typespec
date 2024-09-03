// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.parameters.bodyoptionality;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpPipelineCallContext;
import com.azure.core.http.HttpPipelineNextPolicy;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.HttpPipelinePolicy;
import com.parameters.bodyoptionality.models.BodyModel;
import org.junit.jupiter.api.AssertionFailureBuilder;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

public class BodyTests {

    private final ContentTypeValidationPolicy validationPolicy = new ContentTypeValidationPolicy();
    private final BodyOptionalityClient client = new BodyOptionalityClientBuilder().buildClient();
    private final OptionalExplicitClient optionalClient = new BodyOptionalityClientBuilder()
            .addPolicy(validationPolicy)
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS))
            .buildOptionalExplicitClient();

    private final static class ContentTypeValidationPolicy implements HttpPipelinePolicy {
        private boolean contentTypeHeaderExists;

        @Override
        public Mono<HttpResponse> process(HttpPipelineCallContext context, HttpPipelineNextPolicy nextPolicy) {
            contentTypeHeaderExists = context.getHttpRequest().getHeaders().get(HttpHeaderName.CONTENT_TYPE) != null;
            return nextPolicy.process();
        }

        private void validateContentTypeHeader(boolean exists) {
            if (exists != contentTypeHeaderExists) {
                AssertionFailureBuilder.assertionFailure()
                        .message("content-type header validation failed")
                        .expected(exists)
                        .actual(contentTypeHeaderExists)
                        .buildAndThrow();
            }
        }
    }

    @Test
    public void testBodyOptionality() {
        client.requiredExplicit(new BodyModel("foo"));

        client.requiredImplicit("foo");

        optionalClient.set(new BodyModel("foo"));
        validationPolicy.validateContentTypeHeader(true);

        // verify that content-type is not set, when there is no body parameter
        optionalClient.omit();
        validationPolicy.validateContentTypeHeader(false);
    }
}
