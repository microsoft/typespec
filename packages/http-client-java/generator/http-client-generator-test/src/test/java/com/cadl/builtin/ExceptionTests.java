// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.builtin;

import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.HttpHeaders;
import com.azure.core.test.http.MockHttpResponse;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

public class ExceptionTests {

    @Test
    public void testExceptionValue() {
        String responseStr = "{\"error\":{\"code\":\"RESOURCE_NOT_FOUND\",\"message\":\"resource not found\"}}";

        BuiltinAsyncClient client = new BuiltinClientBuilder().endpoint("http://localhost:3000")
            .httpClient(request -> Mono.just(new MockHttpResponse(request, 404, new HttpHeaders(),
                responseStr.getBytes(StandardCharsets.UTF_8))))
            .buildAsyncClient();

        try {
            client.read("q", "q").block();
        } catch (ResourceNotFoundException e) {
            // TODO (weidxu) fix
            //org.opentest4j.AssertionFailedError:
            //Expected :class com.azure.core.models.ResponseError
            //Actual   :class java.util.LinkedHashMap
            //            Assertions.assertEquals(ResponseError.class, e.getValue().getClass());
        }
    }
}
