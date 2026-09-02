// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.methodoverride;

import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.BinaryData;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.methodoverride.implementation.MethodOverrideClientImpl;
import tsptest.methodoverride.models.GroupAllOptions;
import tsptest.methodoverride.models.GroupHeaderOptions;
import tsptest.methodoverride.models.GroupQueryKind;
import tsptest.methodoverride.models.GroupQueryOptions;

public class MethodOverrideTests {

    @Test
    public void protocolMethodsReuseQueryParameterGroup() {
        assertProtocolSignatures(MethodOverrideClient.class);
        assertProtocolSignatures(MethodOverrideAsyncClient.class);
    }

    @Test
    public void protocolMethodAddsGroupedQueryParameters() {
        AtomicReference<String> queryCaptor = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            queryCaptor.set(request.getUrl().getQuery());
            return Mono.just(new MockHttpResponse(request, 200));
        }).build();
        MethodOverrideClientImpl implementation = new MethodOverrideClientImpl(pipeline, "https://localhost",
            MethodOverrideServiceVersion.V2022_12_01_PREVIEW);
        MethodOverrideClient client = new MethodOverrideClient(implementation);

        GroupQueryOptions options
            = new GroupQueryOptions().setFoo("foo-value").setBar("bar-value").setKind(GroupQueryKind.SECOND);
        client.groupQueryWithResponse(options, new RequestOptions());

        Assertions.assertTrue(queryCaptor.get().contains("foo=foo-value"));
        Assertions.assertTrue(queryCaptor.get().contains("bar=bar-value"));
        Assertions.assertTrue(queryCaptor.get().contains("kind=second"));
        Assertions.assertEquals(1, countOccurrences(queryCaptor.get(), "foo=foo-value"));
        Assertions.assertEquals(1, countOccurrences(queryCaptor.get(), "bar=bar-value"));
        Assertions.assertEquals(1, countOccurrences(queryCaptor.get(), "kind=second"));
    }

    @Test
    public void convenienceMethodsForwardQueryParameterGroup() {
        AtomicReference<String> queryCaptor = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            queryCaptor.set(request.getUrl().getQuery());
            return Mono.just(new MockHttpResponse(request, 200));
        }).build();
        MethodOverrideClientImpl implementation = new MethodOverrideClientImpl(pipeline, "https://localhost",
            MethodOverrideServiceVersion.V2022_12_01_PREVIEW);
        GroupQueryOptions options
            = new GroupQueryOptions().setFoo("foo-value").setBar("bar-value").setKind(GroupQueryKind.SECOND);

        new MethodOverrideClient(implementation).groupQuery(options);
        assertGroupedQuery(queryCaptor.get());

        new MethodOverrideAsyncClient(implementation).groupQuery(options).block();
        assertGroupedQuery(queryCaptor.get());

        new MethodOverrideClient(implementation).groupAll(new GroupAllOptions("prop1").setFoo("foo-value"));
        Assertions.assertTrue(queryCaptor.get().contains("foo=foo-value"));
    }

    @Test
    public void protocolAndConvenienceMethodsAddGroupedHeaders() {
        AtomicReference<String> fooHeaderCaptor = new AtomicReference<>();
        AtomicReference<String> barHeaderCaptor = new AtomicReference<>();
        HttpPipeline pipeline = new HttpPipelineBuilder().httpClient(request -> {
            fooHeaderCaptor.set(request.getHeaders().getValue("x-foo"));
            barHeaderCaptor.set(request.getHeaders().getValue("x-bar"));
            return Mono.just(new MockHttpResponse(request, 200));
        }).build();
        MethodOverrideClientImpl implementation = new MethodOverrideClientImpl(pipeline, "https://localhost",
            MethodOverrideServiceVersion.V2022_12_01_PREVIEW);
        GroupHeaderOptions options = new GroupHeaderOptions().setFoo("foo-value").setBar("bar-value");

        new MethodOverrideClient(implementation).groupHeaderWithResponse(options, new RequestOptions());
        Assertions.assertEquals("foo-value", fooHeaderCaptor.get());
        Assertions.assertEquals("bar-value", barHeaderCaptor.get());

        new MethodOverrideAsyncClient(implementation).groupHeader(options).block();
        Assertions.assertEquals("foo-value", fooHeaderCaptor.get());
        Assertions.assertEquals("bar-value", barHeaderCaptor.get());
    }

    private static void assertProtocolSignatures(Class<?> clientClass) {
        Assertions.assertDoesNotThrow(
            () -> clientClass.getMethod("groupQueryWithResponse", GroupQueryOptions.class, RequestOptions.class));
        Assertions.assertDoesNotThrow(() -> clientClass.getMethod("groupExcludeBodyWithResponse", BinaryData.class,
            GroupQueryOptions.class, RequestOptions.class));
        Assertions.assertDoesNotThrow(
            () -> clientClass.getMethod("groupHeaderWithResponse", GroupHeaderOptions.class, RequestOptions.class));
    }

    private static int countOccurrences(String value, String search) {
        return (value.length() - value.replace(search, "").length()) / search.length();
    }

    private static void assertGroupedQuery(String query) {
        Assertions.assertTrue(query.contains("foo=foo-value"));
        Assertions.assertTrue(query.contains("bar=bar-value"));
        Assertions.assertTrue(query.contains("kind=second"));
        Assertions.assertEquals(1, countOccurrences(query, "foo=foo-value"));
        Assertions.assertEquals(1, countOccurrences(query, "bar=bar-value"));
        Assertions.assertEquals(1, countOccurrences(query, "kind=second"));
    }
}
