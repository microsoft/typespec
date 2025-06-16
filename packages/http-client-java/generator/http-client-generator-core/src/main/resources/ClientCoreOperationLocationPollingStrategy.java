import com.azure.v2.core.http.polling.LongRunningOperationStatus;
import com.azure.v2.core.http.polling.OperationResourcePollingStrategy;
import com.azure.v2.core.http.polling.PollResponse;
import com.azure.v2.core.http.polling.PollingContext;
import com.azure.v2.core.http.polling.PollingStrategyOptions;
import io.clientcore.core.http.models.HttpHeader;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.CoreException;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.ObjectSerializer;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;

import java.io.UncheckedIOException;
import java.lang.reflect.Type;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;

// DO NOT modify this helper class

/**
 * Implements a synchronous operation location polling strategy, from Operation-Location.
 *
 * @param <T> the type of the response type from a polling call, or BinaryData if raw response body should be kept
 * @param <U> the type of the final result object to deserialize into, or BinaryData if raw response body should be
 * kept
 */
public final class OperationLocationPollingStrategy<T, U> extends OperationResourcePollingStrategy<T, U> {

    private static final ClientLogger LOGGER = new ClientLogger(OperationLocationPollingStrategy.class);

    private final ObjectSerializer serializer;
    private final String endpoint;
    private final String propertyName;

    /**
     * Creates an instance of the operation resource polling strategy.
     *
     * @param pollingStrategyOptions options to configure this polling strategy.
     * @throws NullPointerException if {@code pollingStrategyOptions} is null.
     */
    public OperationLocationPollingStrategy(PollingStrategyOptions pollingStrategyOptions) {
        this(pollingStrategyOptions, null);
    }

    /**
     * Creates an instance of the operation resource polling strategy.
     *
     * @param pollingStrategyOptions options to configure this polling strategy.
     * @param propertyName the name of the property to extract final result.
     * @throws NullPointerException if {@code pollingStrategyOptions} is null.
     */
    public OperationLocationPollingStrategy(PollingStrategyOptions pollingStrategyOptions, String propertyName) {
        super(PollingUtils.OPERATION_LOCATION_HEADER, pollingStrategyOptions);
        this.propertyName = propertyName;
        this.endpoint = pollingStrategyOptions.getEndpoint();
        this.serializer = pollingStrategyOptions.getSerializer() != null
            ? pollingStrategyOptions.getSerializer()
            : JsonSerializer.getInstance();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PollResponse<T> onInitialResponse(Response<T> response, PollingContext<T> pollingContext,
                                             Type pollResponseType) {
        // Response<?> is Response<BinaryData>

        HttpHeader operationLocationHeader = response.getHeaders().get(PollingUtils.OPERATION_LOCATION_HEADER);
        if (operationLocationHeader != null) {
            pollingContext.setData(PollingUtils.OPERATION_LOCATION_HEADER.getCaseSensitiveName(),
                PollingUtils.getAbsolutePath(operationLocationHeader.getValue(), endpoint, LOGGER));
        }
        final String httpMethod = response.getRequest().getHttpMethod().name();
        pollingContext.setData(PollingUtils.HTTP_METHOD, httpMethod);
        pollingContext.setData(PollingUtils.REQUEST_URL, response.getRequest().getUri().toString());

        if (response.getStatusCode() == 200
            || response.getStatusCode() == 201
            || response.getStatusCode() == 202
            || response.getStatusCode() == 204) {
            final Duration retryAfter
                = PollingUtils.getRetryAfterFromHeaders(response.getHeaders(), OffsetDateTime::now);
            T initialResponseType = null;
            try {
                initialResponseType = PollingUtils.deserializeResponse((BinaryData) response.getValue(), serializer,
                    pollResponseType);
            } catch (UncheckedIOException e) {
                LOGGER.atInfo().log("Failed to parse initial response.");
            }
            return new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, initialResponseType, retryAfter);
        }

        throw LOGGER.throwableAtError()
            .addKeyValue(PollingUtils.OPERATION_LOCATION_HEADER, operationLocationHeader)
            .addKeyValue("statusCode", response.getStatusCode())
            .addKeyValue("responseBody", response.getValue())
            .log("Operation failed or cancelled", RuntimeException::new);
    }

    /**
     * {@inheritDoc}
     */
    public U getResult(PollingContext<T> pollingContext, Type resultType) {
        if (pollingContext.getLatestResponse().getStatus() == LongRunningOperationStatus.FAILED) {
            throw LOGGER.throwableAtError().log("Long running operation failed.", RuntimeException::new);
        } else if (pollingContext.getLatestResponse().getStatus() == LongRunningOperationStatus.USER_CANCELLED) {
            throw LOGGER.throwableAtError().log("Long running operation cancelled.", RuntimeException::new);
        }
        if (propertyName != null) {
            // take the last poll response body from PollingContext,
            // and de-serialize the <propertyName> property as final result
            BinaryData latestResponseBody
                = BinaryData.fromString(pollingContext.getData(PollingUtils.POLL_RESPONSE_BODY));
            Map<String, Object> pollResult = PollingUtils.deserializeResponse(latestResponseBody, serializer,
                CoreUtils.createParameterizedType(Map.class, String.class, Object.class));
            if (pollResult != null && pollResult.get(propertyName) != null) {
                return PollingUtils.deserializeResponse(BinaryData.fromObject(pollResult.get(propertyName)),
                    serializer, resultType);
            } else {
                throw LOGGER.throwableAtError().log("Cannot get final result", RuntimeException::new);
            }
        } else {
            return super.getResult(pollingContext, resultType);
        }
    }
}
