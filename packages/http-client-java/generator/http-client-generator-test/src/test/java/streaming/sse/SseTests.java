// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package streaming.sse;

import com.azure.core.util.CloseableIterableStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import streaming.sse.named.models.ResponseEvent;
import streaming.sse.named.models.ResponseEventLiteral3StreamEvent;
import streaming.sse.named.models.ResponseEventResponseCreatedStreamEvent;
import streaming.sse.named.models.ResponseEventResponseDeltaStreamEvent;
import streaming.sse.retrieve.models.RetrievalEvent;
import streaming.sse.retrieve.models.RetrievalEventFinalResultStreamEvent;
import streaming.sse.retrieve.models.RetrievalEventLiteral3StreamEvent;
import streaming.sse.retrieve.models.RetrievalRequest;
import streaming.sse.unnamed.models.Info;

public final class SseTests {
    @Test
    public void receivesUnnamedPayloadsInOrderAsyncAndSync() throws IOException {
        SseClientBuilder builder = new SseClientBuilder();
        Assertions.assertEquals(List.of("one", "two", "three"),
            builder.buildUnnamedAsyncClient().receive().map(Info::getDesc).collectList().block());
        try (CloseableIterableStream<Info> stream = builder.buildUnnamedClient().receive()) {
            Assertions.assertEquals(List.of("one", "two", "three"),
                stream.stream().map(Info::getDesc).collect(Collectors.toList()));
        }
    }

    @Test
    public void receivesNamedEventsAndDeliversRawTerminalLiteralAsyncAndSync() throws IOException {
        SseClientBuilder builder = new SseClientBuilder();
        assertNamed(builder.buildNamedAsyncClient().receive().collectList().block());
        try (CloseableIterableStream<ResponseEvent> stream = builder.buildNamedClient().receive()) {
            List<ResponseEvent> events = new ArrayList<>();
            stream.forEach(events::add);
            assertNamed(events);
        }
    }

    @Test
    public void postsRetrievalRequestAndDeliversTerminalLiteralAsyncAndSync() throws IOException {
        SseClientBuilder builder = new SseClientBuilder();
        RetrievalRequest request = new RetrievalRequest("what is typespec?");
        assertRetrieval(builder.buildRetrieveAsyncClient().stream(request).collectList().block());
        try (CloseableIterableStream<RetrievalEvent> stream = builder.buildRetrieveClient().stream(request)) {
            List<RetrievalEvent> events = new ArrayList<>();
            stream.forEach(events::add);
            assertRetrieval(events);
        }
    }

    private static void assertNamed(List<ResponseEvent> events) {
        Assertions.assertNotNull(events);
        Assertions.assertEquals(4, events.size());
        Assertions.assertEquals("resp_1",
            Assertions.assertInstanceOf(ResponseEventResponseCreatedStreamEvent.class, events.get(0))
                .getValue()
                .getId());
        Assertions.assertEquals("Hello",
            Assertions.assertInstanceOf(ResponseEventResponseDeltaStreamEvent.class, events.get(1))
                .getValue()
                .getDelta());
        Assertions.assertEquals(" world",
            Assertions.assertInstanceOf(ResponseEventResponseDeltaStreamEvent.class, events.get(2))
                .getValue()
                .getDelta());
        Assertions.assertEquals("[DONE]",
            Assertions.assertInstanceOf(ResponseEventLiteral3StreamEvent.class, events.get(3)).getValue());
        Assertions.assertEquals("message", events.get(3).getEventName());
        Assertions.assertTrue(events.get(3).isTerminal());
    }

    private static void assertRetrieval(List<RetrievalEvent> events) {
        Assertions.assertNotNull(events);
        Assertions.assertEquals(4, events.size());
        Assertions.assertEquals(List.of("doc1", "doc2"),
            Assertions.assertInstanceOf(RetrievalEventFinalResultStreamEvent.class, events.get(2))
                .getValue()
                .getReferences());
        Assertions.assertEquals("[DONE]",
            Assertions.assertInstanceOf(RetrievalEventLiteral3StreamEvent.class, events.get(3)).getValue());
        Assertions.assertTrue(events.get(3).isTerminal());
    }
}
