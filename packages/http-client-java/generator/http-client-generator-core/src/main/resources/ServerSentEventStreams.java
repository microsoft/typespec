import com.azure.core.http.rest.Response;
import com.azure.core.util.BinaryData;
import com.azure.core.util.CloseableIterableStream;
import java.util.function.BiFunction;
import java.util.function.Predicate;
import reactor.core.publisher.Flux;

/**
 * Consumes a single HTTP response as a server-sent event stream.
 */
public final class ServerSentEventStreams {
    private ServerSentEventStreams() {
    }

    /**
     * Decodes one response until an inclusive terminal event is emitted.
     *
     * <p>HTTP 204 and response-body EOF complete normally without requiring a terminal event.</p>
     *
     * @param response The streaming response.
     * @param converter Converts an event name and data payload into the event data type.
     * @param terminalEvent Identifies an inclusive terminal event that ends processing early.
     * @param <T> The event data type.
     * @return A flux of decoded server-sent events.
     */
    public static <T> Flux<T> toFlux(Response<BinaryData> response, BiFunction<String, String, T> converter,
        Predicate<T> terminalEvent) {
        return ServerSentEventStream.toFlux(response, converter, terminalEvent);
    }

    /**
     * Lazily decodes one response until an inclusive terminal event is emitted.
     *
     * <p>HTTP 204 and response-body EOF close normally without requiring a terminal event.</p>
     *
     * @param response The streaming response.
     * @param converter Converts an event name and data payload into the event data type.
     * @param terminalEvent Identifies an inclusive terminal event that ends processing early.
     * @param <T> The event data type.
     * @return A single-use closeable stream of decoded events.
     */
    public static <T> CloseableIterableStream<T> toIterableStream(Response<BinaryData> response,
        BiFunction<String, String, T> converter, Predicate<T> terminalEvent) {
        return ServerSentEventStream.toIterableStream(response, converter, terminalEvent);
    }
}
