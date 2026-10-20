// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.sse.models.implementation.sse;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.BinaryData;
import com.azure.core.util.CloseableIterableStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BiFunction;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import tsptest.sse.stream.implementation.TestStreamEventConverter;
import tsptest.sse.stream.models.TestCompletedStreamEvent;
import tsptest.sse.stream.models.TestStartedStreamEvent;
import tsptest.sse.stream.models.TestStreamEvent;

public class ServerSentEventStreamTests {
    private static final BiFunction<String, String, TestStreamEvent> CONVERTER = TestStreamEventConverter::convert;

    @Test
    public void decodesFragmentedUtf8AndCrLfUntilInclusiveTerminalEvent() {
        String content = "\uFEFFevent: started\r\ndata: {\"message\":\"h\u20ACllo\"}\r\n\r\n"
            + "event: future.event\r\ndata: ignored\r\n\r\n"
            + "event: completed\r\ndata: {\"result\":[\"one\",\"two\"]}\r\n\r\n"
            + "event: started\r\ndata: {\"message\":\"after terminal\"}\r\n\r\n";
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        List<ByteBuffer> fragments = new ArrayList<>(bytes.length);
        for (byte value : bytes) {
            fragments.add(ByteBuffer.wrap(new byte[] { value }));
        }
        AtomicBoolean cancelled = new AtomicBoolean();
        BinaryData body
            = BinaryData.fromFlux(Flux.fromIterable(fragments).doOnCancel(() -> cancelled.set(true)), null, false)
                .block();

        List<TestStreamEvent> events
            = ServerSentEventStreams
                .toFlux(response(200, "text/event-stream; charset=utf-8", body), CONVERTER,
                    TestStreamEventConverter::isTerminal)
                .collectList()
                .block();

        Assertions.assertNotNull(events);
        Assertions.assertEquals(3, events.size());
        TestStartedStreamEvent started = Assertions.assertInstanceOf(TestStartedStreamEvent.class, events.get(0));
        Assertions.assertEquals("h\u20ACllo", started.getValue().getMessage());
        Assertions.assertEquals("future.event", events.get(1).getEventName());
        TestCompletedStreamEvent completed = Assertions.assertInstanceOf(TestCompletedStreamEvent.class, events.get(2));
        Assertions.assertEquals(List.of("one", "two"), completed.getValue().getResult());
        Assertions.assertTrue(completed.isTerminal());
        Assertions.assertTrue(cancelled.get());
    }

    @Test
    public void iterableCompletesAtEofAndClosesTheResponseStream() throws IOException {
        TrackingInputStream input = new TrackingInputStream(
            "event: started\ndata: {\"message\":\"one\"}\n\n".getBytes(StandardCharsets.UTF_8), 1);

        try (CloseableIterableStream<TestStreamEvent> events = ServerSentEventStreams
            .toIterableStream(response(200, "text/event-stream", BinaryData.fromStream(input)), CONVERTER)) {
            List<TestStreamEvent> values = new ArrayList<>();
            events.forEach(values::add);
            Assertions.assertEquals(1, values.size());
            Assertions.assertEquals("one",
                Assertions.assertInstanceOf(TestStartedStreamEvent.class, values.get(0)).getValue().getMessage());
        }

        Assertions.assertTrue(input.isClosed());
    }

    @Test
    public void iterableClosesImmediatelyAfterReturningTheTerminalEvent() throws IOException {
        TrackingInputStream input = new TrackingInputStream(
            ("event: completed\ndata: {\"result\":[]}\n\n" + "event: started\ndata: {\"message\":\"unreachable\"}\n\n")
                .getBytes(StandardCharsets.UTF_8),
            2);

        try (CloseableIterableStream<TestStreamEvent> events
            = ServerSentEventStreams.toIterableStream(response(200, "text/event-stream", BinaryData.fromStream(input)),
                CONVERTER, TestStreamEventConverter::isTerminal)) {
            java.util.Iterator<TestStreamEvent> iterator = events.iterator();
            Assertions.assertInstanceOf(TestCompletedStreamEvent.class, iterator.next());
            Assertions.assertTrue(input.isClosed());
            Assertions.assertFalse(iterator.hasNext());
        }
    }

    @Test
    public void rejectsInvalidResponsesAndClosesTheirBodies() {
        assertInvalidResponseClosed(500, "text/event-stream");
        assertInvalidResponseClosed(200, "application/json");
        assertInvalidResponseClosed(200, "text/event-stream, application/json");
    }

    @Test
    public void noContentClosesTheBodyAndCompletesWithoutEvents() {
        TrackingInputStream input = new TrackingInputStream(new byte[] { 1 }, 1);
        CloseableIterableStream<TestStreamEvent> events
            = ServerSentEventStreams.toIterableStream(response(204, null, BinaryData.fromStream(input)), CONVERTER);

        Assertions.assertFalse(events.iterator().hasNext());
        Assertions.assertTrue(input.isClosed());
    }

    @Test
    public void streamCanOnlyBeConsumedOnce() {
        Flux<TestStreamEvent> events = ServerSentEventStreams.toFlux(response(204, null, null), CONVERTER);

        Assertions.assertTrue(events.collectList().block().isEmpty());
        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> events.collectList().block());
        Assertions.assertTrue(exception.getMessage().contains("only one subscription"));
    }

    private static void assertInvalidResponseClosed(int statusCode, String contentType) {
        TrackingInputStream input = new TrackingInputStream(new byte[] { 1 }, 1);

        Assertions.assertThrows(IllegalStateException.class, () -> ServerSentEventStreams
            .toIterableStream(response(statusCode, contentType, BinaryData.fromStream(input)), CONVERTER));
        Assertions.assertTrue(input.isClosed());
    }

    private static Response<BinaryData> response(int statusCode, String contentType, BinaryData body) {
        HttpHeaders headers = new HttpHeaders();
        if (contentType != null) {
            headers.set(HttpHeaderName.CONTENT_TYPE, contentType);
        }
        return new SimpleResponse<>(null, statusCode, headers, body);
    }

    private static final class TrackingInputStream extends InputStream {
        private final ByteArrayInputStream delegate;
        private final int maximumReadSize;
        private final AtomicBoolean closed = new AtomicBoolean();

        private TrackingInputStream(byte[] bytes, int maximumReadSize) {
            this.delegate = new ByteArrayInputStream(bytes);
            this.maximumReadSize = maximumReadSize;
        }

        @Override
        public int read() {
            return delegate.read();
        }

        @Override
        public int read(byte[] bytes, int offset, int length) {
            return delegate.read(bytes, offset, Math.min(length, maximumReadSize));
        }

        @Override
        public void close() throws IOException {
            closed.set(true);
            delegate.close();
        }

        private boolean isClosed() {
            return closed.get();
        }
    }
}
