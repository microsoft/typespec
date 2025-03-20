// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.bodyoptionality;

import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipelineNextPolicy;
import io.clientcore.core.http.pipeline.HttpPipelinePolicy;
import org.junit.jupiter.api.AssertionFailureBuilder;
import org.junit.jupiter.api.Test;

public class BodyTests {

    private final ContentTypeValidationPolicy validationPolicy = new ContentTypeValidationPolicy();
    private final BodyOptionalityClient client = new BodyOptionalityClientBuilder().buildClient();
    private final OptionalExplicitClient optionalClient
        = new BodyOptionalityClientBuilder().addHttpPipelinePolicy(validationPolicy).buildOptionalExplicitClient();

    private final static class ContentTypeValidationPolicy implements HttpPipelinePolicy {
        private boolean contentTypeHeaderExists;

        @Override
        public Response process(HttpRequest request, HttpPipelineNextPolicy nextPolicy) {
            contentTypeHeaderExists = request.getHeaders().get(HttpHeaderName.CONTENT_TYPE) != null;
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
