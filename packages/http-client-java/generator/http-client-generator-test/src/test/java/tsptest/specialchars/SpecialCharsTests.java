// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.specialchars;

import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.BinaryData;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.specialchars.implementation.SpecialCharsClientImpl;
import tsptest.specialchars.models.Resource;

public class SpecialCharsTests {

    @Test
    public void testRead() {
        AtomicReference<BinaryData> payloadCaptor = new AtomicReference<>();

        String responseJson
            = "{\"id\":\"test-id\",\"aggregate\":\"avg\",\"condition\":\">\",\"requestName\":\"myRequest\",\"value\":1.5}";

        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            payloadCaptor.set(request.getBodyAsBinaryData());
            return Mono.just(new MockHttpResponse(request, 200, BinaryData.fromString(responseJson).toBytes()));
        }).build();

        SpecialCharsClientImpl impl = new SpecialCharsClientImpl(pipeline, "https://localhost");
        SpecialCharsClient client = new SpecialCharsClient(impl.getBuiltinOps());

        Resource response = client.read("test-id");

        // verify request body
        Assertions.assertEquals("{\"id\":\"test-id\"}", payloadCaptor.get().toString());

        // verify response deserialization
        Assertions.assertNotNull(response);
        Assertions.assertEquals("test-id", response.getId());
        Assertions.assertEquals("avg", response.getAggregate());
        // condition field has doc with special chars ('>' and '<')
        Assertions.assertEquals(">", response.getCondition());
        Assertions.assertEquals("myRequest", response.getRequestName());
        Assertions.assertEquals(1.5, response.getValue(), 0.001);
    }

    @Test
    public void testResourceSerialization() {
        // Test that model serialization/deserialization works with special chars in documentation
        String json
            = "{\"id\":\"resource-1\",\"aggregate\":\"percentage\",\"condition\":\"<\",\"requestName\":\"req1\",\"value\":95.5}";

        Resource resource = BinaryData.fromString(json).toObject(Resource.class);

        Assertions.assertEquals("resource-1", resource.getId());
        Assertions.assertEquals("percentage", resource.getAggregate());
        // condition field doc contains '>' and '<' special chars
        Assertions.assertEquals("<", resource.getCondition());
        Assertions.assertEquals("req1", resource.getRequestName());
        Assertions.assertEquals(95.5, resource.getValue(), 0.001);

        // re-serialize
        String serialized = BinaryData.fromObject(resource).toString();
        Assertions.assertTrue(serialized.contains("\"id\":\"resource-1\""));
        Assertions.assertTrue(serialized.contains("\"condition\":\"<\""));
    }
}
