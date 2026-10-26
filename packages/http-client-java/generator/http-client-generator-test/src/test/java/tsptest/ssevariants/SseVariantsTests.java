// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.ssevariants;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.BinaryData;
import com.azure.core.util.CloseableIterableStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.reflect.Modifier;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import tsptest.ssevariants.implementation.BooleanTerminalEventConverter;
import tsptest.ssevariants.implementation.DirectArrayEventConverter;
import tsptest.ssevariants.implementation.DirectCollectionsEventConverter;
import tsptest.ssevariants.implementation.DirectModelEventConverter;
import tsptest.ssevariants.implementation.DirectNumberEventConverter;
import tsptest.ssevariants.implementation.DirectTerminalEventConverter;
import tsptest.ssevariants.implementation.DirectTextEventConverter;
import tsptest.ssevariants.implementation.LiteralStreamEventConverter;
import tsptest.ssevariants.implementation.NamedLiteralStreamEventConverter;
import tsptest.ssevariants.implementation.NumberTerminalEventConverter;
import tsptest.ssevariants.implementation.VariantsStreamEventConverter;
import tsptest.ssevariants.models.BooleanTerminalEvent;
import tsptest.ssevariants.models.LiteralLiteral2StreamEvent;
import tsptest.ssevariants.models.LiteralLiteral3StreamEvent;
import tsptest.ssevariants.models.LiteralLiteral4StreamEvent;
import tsptest.ssevariants.models.LiteralLiteral5StreamEvent;
import tsptest.ssevariants.models.LiteralLiteral6StreamEvent;
import tsptest.ssevariants.models.LiteralLiteral7StreamEvent;
import tsptest.ssevariants.models.LiteralStreamEvent;
import tsptest.ssevariants.models.NumberTerminalEvent;
import tsptest.ssevariants.models.VariantsDefaultStreamEvent;
import tsptest.ssevariants.models.VariantsLiteral3StreamEvent;
import tsptest.ssevariants.models.VariantsLiteral4StreamEvent;
import tsptest.ssevariants.models.VariantsLiteral5StreamEvent;
import tsptest.ssevariants.models.VariantsStreamEvent;
import tsptest.ssevariants.models.implementation.sse.ServerSentEventStreams;

public class SseVariantsTests {
    @Test
    public void directPayloadsUseDefaultIdentityBoxingAndRecursiveCallbacks() {
        for (String identity : new String[] { null, "", "message" }) {
            Assertions.assertEquals("one", DirectTextEventConverter.convert(identity, "\"one\""));
            Assertions.assertEquals(Integer.valueOf(42), DirectNumberEventConverter.convert(identity, "42"));
            Assertions.assertEquals("one",
                DirectModelEventConverter.convert(identity, "{\"value\":\"one\"}").getValue());
            Assertions.assertEquals(List.of("one", "two"),
                DirectArrayEventConverter.convert(identity, "[\"one\",\"two\"]"));
            Assertions.assertEquals("nested",
                DirectCollectionsEventConverter.convert(identity, "[{\"items\":[{\"value\":\"nested\"}]}]")
                    .get(0)
                    .get("items")
                    .get(0)
                    .getValue());
        }
        Assertions.assertThrows(IllegalStateException.class,
            () -> DirectTextEventConverter.convert("other", "\"one\""));
        Assertions.assertThrows(NullPointerException.class, () -> DirectTextEventConverter.convert("message", "null"));
        Assertions.assertThrows(NullPointerException.class,
            () -> DirectNumberEventConverter.convert("message", "null"));
        Assertions.assertThrows(RuntimeException.class, () -> DirectArrayEventConverter.convert("message", "not-json"));
    }

    @Test
    public void mixedStreamsMatchLiteralsBeforeGeneralPayloadsWithoutCrossingIdentities() {
        VariantsStreamEvent payload = VariantsStreamEventConverter.convert(null, "\"one\"");
        Assertions.assertEquals("message", payload.getEventName());
        Assertions.assertEquals("one",
            Assertions.assertInstanceOf(VariantsDefaultStreamEvent.class, payload).getValue());
        Assertions.assertInstanceOf(VariantsLiteral4StreamEvent.class,
            VariantsStreamEventConverter.convert("", "true"));
        Assertions.assertInstanceOf(VariantsLiteral5StreamEvent.class,
            VariantsStreamEventConverter.convert("message", "42.0"));
        VariantsStreamEvent terminal = VariantsStreamEventConverter.convert("message", "[DONE]");
        Assertions.assertInstanceOf(VariantsLiteral3StreamEvent.class, terminal);
        Assertions.assertTrue(terminal.isTerminal());
        VariantsStreamEvent jsonMarker = VariantsStreamEventConverter.convert("message", "\"[DONE]\"");
        Assertions.assertInstanceOf(VariantsDefaultStreamEvent.class, jsonMarker);
        Assertions.assertFalse(jsonMarker.isTerminal());
        VariantsStreamEvent unknown = VariantsStreamEventConverter.convert("future", "[DONE]");
        Assertions.assertEquals("future", unknown.getEventName());
        Assertions.assertFalse(unknown.isTerminal());
        Assertions.assertFalse(NamedLiteralStreamEventConverter.convert("message", "[DONE]").isTerminal());
        Assertions.assertTrue(NamedLiteralStreamEventConverter.convert("done", "[DONE]").isTerminal());
        Assertions.assertThrows(RuntimeException.class,
            () -> NamedLiteralStreamEventConverter.convert("done", "\"[DONE]\""));
    }

    @Test
    public void literalMatchingValidatesPrimitiveKindsWholeJsonAndExactNumbers() {
        Assertions.assertEquals("quoted",
            Assertions
                .assertInstanceOf(LiteralLiteral2StreamEvent.class,
                    LiteralStreamEventConverter.convert(null, "  \"qu\\u006fted\" \n"))
                .getValue());
        Assertions.assertEquals("",
            Assertions
                .assertInstanceOf(LiteralLiteral3StreamEvent.class, LiteralStreamEventConverter.convert("", "\"\""))
                .getValue());
        Assertions.assertTrue(
            Assertions
                .assertInstanceOf(LiteralLiteral4StreamEvent.class,
                    LiteralStreamEventConverter.convert("message", " true "))
                .getValue());
        Assertions.assertFalse(Assertions
            .assertInstanceOf(LiteralLiteral5StreamEvent.class, LiteralStreamEventConverter.convert("message", "false"))
            .getValue());
        Assertions.assertEquals(42,
            Assertions
                .assertInstanceOf(LiteralLiteral6StreamEvent.class,
                    LiteralStreamEventConverter.convert("message", "4.2e1"))
                .getValue());
        Assertions.assertEquals(42.5,
            Assertions
                .assertInstanceOf(LiteralLiteral7StreamEvent.class,
                    LiteralStreamEventConverter.convert("message", "42.50"))
                .getValue());
        Assertions.assertFalse(LiteralStreamEventConverter.convert("message", "raw").isTerminal());
        for (String invalid : List.of("\"raw\"", " raw", "\"42\"", "42.9", "42.0000000000000000001", "42 true", "42{}",
            "true false", "\"quoted\" 0", "null", "{}", "[42]", "\"other\"")) {
            Assertions.assertThrows(RuntimeException.class,
                () -> LiteralStreamEventConverter.convert("message", invalid), invalid);
        }
        Assertions.assertEquals("future", LiteralStreamEventConverter.convert("future", "invalid").getEventName());
        Assertions.assertTrue(LiteralStreamEventConverter.convert("message", "\"stop\"").isTerminal());
    }

    @Test
    public void mixedAsyncDeliversTerminalOnceAndCancelsWithoutWaitingForEof() {
        String frames = "data: \"one\"\n\nevent: update\ndata: {\"value\":\"two\"}\n\n"
            + "event: future\ndata: ignored\n\ndata: true\n\ndata: [DONE]\n\ndata: \"after\"\n\n";
        AtomicBoolean cancelled = new AtomicBoolean();
        BinaryData body = BinaryData.fromFlux(
            Flux.concat(Flux.just(ByteBuffer.wrap(frames.getBytes(StandardCharsets.UTF_8))), Flux.<ByteBuffer>never())
                .doOnCancel(() -> cancelled.set(true)),
            null, false).block();
        List<VariantsStreamEvent> events = ServerSentEventStreams
            .toFlux(response(body), VariantsStreamEventConverter::convert, VariantsStreamEvent::isTerminal)
            .collectList()
            .block(Duration.ofSeconds(5));
        Assertions.assertNotNull(events);
        Assertions.assertEquals(5, events.size());
        Assertions.assertTrue(events.get(4).isTerminal());
        Assertions.assertTrue(cancelled.get());
    }

    @Test
    public void mixedSyncClosesAfterInclusiveTerminalAndDirectTerminalStopsAfterOnePayload() throws IOException {
        TrackingStream input = new TrackingStream("data: \"one\"\n\ndata: [DONE]\n\ndata: \"after\"\n\n");
        try (CloseableIterableStream<VariantsStreamEvent> stream
            = ServerSentEventStreams.toIterableStream(response(BinaryData.fromStream(input)),
                VariantsStreamEventConverter::convert, VariantsStreamEvent::isTerminal)) {
            List<VariantsStreamEvent> values = new ArrayList<>();
            stream.forEach(values::add);
            Assertions.assertEquals(2, values.size());
            Assertions.assertTrue(values.get(1).isTerminal());
            Assertions.assertTrue(input.closed);
        }
        List<String> values
            = ServerSentEventStreams
                .toFlux(response(BinaryData.fromString("data: \"one\"\n\ndata: \"two\"\n\n")),
                    DirectTerminalEventConverter::convert, value -> true)
                .collectList()
                .block();
        Assertions.assertEquals(List.of("one"), values);
    }

    @Test
    public void literalOnlyStreamsContinueForNonterminalVariants() {
        List<LiteralStreamEvent> events = ServerSentEventStreams.toFlux(
            response(
                BinaryData.fromString("data: raw\n\ndata: 42\n\ndata: true\n\ndata: \"stop\"\n\ndata: \"quoted\"\n\n")),
            LiteralStreamEventConverter::convert, LiteralStreamEvent::isTerminal).collectList().block();
        Assertions.assertNotNull(events);
        Assertions.assertEquals(4, events.size());
        Assertions.assertTrue(events.get(3).isTerminal());
        Assertions.assertFalse(events.get(0).isTerminal());
    }

    @Test
    public void booleanAndNumberTerminalsAreDeliveredInclusively() throws IOException {
        var booleans
            = ServerSentEventStreams
                .toFlux(response(BinaryData.fromString("data: true\n\ndata: false\n\n")),
                    BooleanTerminalEventConverter::convert, BooleanTerminalEvent::isTerminal)
                .collectList()
                .block();
        Assertions.assertNotNull(booleans);
        Assertions.assertEquals(1, booleans.size());
        Assertions.assertTrue(booleans.get(0).isTerminal());
        TrackingStream input = new TrackingStream("data: 42.50\n\ndata: 0\n\n");
        try (var stream = ServerSentEventStreams.toIterableStream(response(BinaryData.fromStream(input)),
            NumberTerminalEventConverter::convert, NumberTerminalEvent::isTerminal)) {
            var iterator = stream.iterator();
            Assertions.assertTrue(iterator.next().isTerminal());
            Assertions.assertTrue(input.closed);
            Assertions.assertFalse(iterator.hasNext());
        }
    }

    @Test
    public void directDefaultFramingPreservesItemsAndClosesOnUnexpectedNames() throws IOException {
        var values = ServerSentEventStreams.toFlux(
            response(
                BinaryData.fromString("data: \"one\"\n\nevent:\ndata: \"two\"\n\nevent: message\ndata: \"three\"\n\n")),
            DirectTextEventConverter::convert).collectList().block();
        Assertions.assertEquals(List.of("one", "two", "three"), values);
        TrackingStream input = new TrackingStream("event: unexpected\ndata: \"one\"\n\n");
        try (var stream = ServerSentEventStreams.toIterableStream(response(BinaryData.fromStream(input)),
            DirectTextEventConverter::convert)) {
            Assertions.assertThrows(IllegalStateException.class, () -> stream.iterator().hasNext());
            Assertions.assertTrue(input.closed);
        }
        TrackingStream terminal = new TrackingStream("data: \"one\"\n\ndata: \"two\"\n\n");
        try (var stream = ServerSentEventStreams.toIterableStream(response(BinaryData.fromStream(terminal)),
            DirectTerminalEventConverter::convert, value -> true)) {
            Assertions.assertEquals("one", stream.iterator().next());
            Assertions.assertTrue(terminal.closed);
        }
    }

    @Test
    public void wrappersKeepSdkOnlyConstructors() {
        for (Class<?> type : List.of(VariantsStreamEvent.class, VariantsDefaultStreamEvent.class,
            VariantsLiteral3StreamEvent.class, LiteralLiteral6StreamEvent.class)) {
            Assertions.assertTrue(java.util.Arrays.stream(type.getDeclaredConstructors())
                .noneMatch(constructor -> Modifier.isPublic(constructor.getModifiers())
                    || Modifier.isProtected(constructor.getModifiers())));
        }
    }

    private static Response<BinaryData> response(BinaryData body) {
        return new SimpleResponse<>(null, 200, new HttpHeaders().set(HttpHeaderName.CONTENT_TYPE, "text/event-stream"),
            body);
    }

    private static final class TrackingStream extends ByteArrayInputStream {
        private boolean closed;

        private TrackingStream(String content) {
            super(content.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public void close() throws IOException {
            closed = true;
            super.close();
        }
    }
}
