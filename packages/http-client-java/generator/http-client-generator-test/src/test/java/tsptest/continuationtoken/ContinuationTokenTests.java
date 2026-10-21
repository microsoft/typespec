// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.continuationtoken;

import com.azure.core.http.rest.PagedFlux;
import com.azure.core.http.rest.PagedIterable;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.continuationtoken.models.Pet;

public class ContinuationTokenTests {
    private final ContinuationTokenClientBuilder builder
        = new ContinuationTokenClientBuilder().endpoint("http://localhost:3000");

    @Test
    public void testHiddenTokens() {
        ContinuationTokenClient client = builder.buildClient();
        assertIds(client.defaultQuery("foo", "bar"), "1", "2", "3", "4");
        assertIds(client.hiddenHeader("foo", "bar"), "1", "2", "3", "4");
        ContinuationTokenAsyncClient asyncClient = builder.buildAsyncClient();
        assertIds(asyncClient.defaultQuery("foo", "bar"), "1", "2", "3", "4");
        assertIds(asyncClient.hiddenHeader("foo", "bar"), "1", "2", "3", "4");
    }

    @Test
    public void testInitialTokenAndRepeatedEnumeration() {
        ContinuationTokenClient client = builder.buildClient();
        ContinuationTokenAsyncClient asyncClient = builder.buildAsyncClient();
        for (boolean initialToken : List.of(false, true)) {
            String token = initialToken ? "page2" : null;
            String[] ids = initialToken ? new String[] { "3", "4" } : new String[] { "1", "2", "3", "4" };
            for (PagedIterable<Pet> result : List.of(client.visibleQuery(token, "foo", "bar"),
                client.visibleHeader(token, "foo", "bar"))) {
                assertIds(result, ids);
                assertIds(result, ids);
            }
            for (PagedFlux<Pet> result : List.of(asyncClient.visibleQuery(token, "foo", "bar"),
                asyncClient.visibleHeader(token, "foo", "bar"))) {
                assertIds(result, ids);
                assertIds(result, ids);
            }
        }
    }

    @Test
    public void testResumeOverridesInitialToken() {
        ContinuationTokenClient client = builder.buildClient();
        for (PagedIterable<Pet> result : List.of(client.visibleQuery("ignored", "foo", "bar"),
            client.visibleHeader("ignored", "foo", "bar"))) {
            Assertions.assertEquals(List.of("3", "4"),
                result.streamByPage("page2")
                    .flatMap(page -> page.getValue().stream())
                    .map(Pet::getId)
                    .collect(Collectors.toList()));
        }
        ContinuationTokenAsyncClient asyncClient = builder.buildAsyncClient();
        for (PagedFlux<Pet> result : List.of(asyncClient.visibleQuery("ignored", "foo", "bar"),
            asyncClient.visibleHeader("ignored", "foo", "bar"))) {
            Assertions.assertEquals(List.of("3", "4"),
                result.byPage("page2")
                    .flatMapIterable(page -> page.getValue())
                    .map(Pet::getId)
                    .collectList()
                    .block(Duration.ofSeconds(10)));
        }
    }

    private static void assertIds(PagedIterable<Pet> result, String... ids) {
        Assertions.assertEquals(List.of(ids), result.stream().map(Pet::getId).collect(Collectors.toList()));
    }

    private static void assertIds(PagedFlux<Pet> result, String... ids) {
        Assertions.assertEquals(List.of(ids), result.map(Pet::getId).collectList().block(Duration.ofSeconds(10)));
    }
}
