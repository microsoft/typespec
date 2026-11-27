// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.lro.operationid.implementation;

import azure.clientgenerator.core.lro.operationid.models.TranslationWithPathStatus;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.rest.Response;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.PollingContext;
import com.azure.core.util.polling.PollingStrategy;
import com.azure.core.util.polling.SyncPollingStrategy;
import com.azure.core.util.serializer.TypeReference;
import com.azure.json.JsonProviders;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;

public class OperationIdPollingStrategyTests {
    static class Status {
        String operationId;
    }

    static class DerivedStatus extends Status {
    }

    @Test
    @SuppressWarnings("unchecked")
    public void usesSelectedHeaderForPolymorphicPollResult() {
        OperationIdPollingStrategy.setOperationIdAccessor(Status.class, (status, id) -> status.operationId = id);
        SyncPollingStrategy<Status, Void> delegate = Mockito.mock(SyncPollingStrategy.class);
        PollingContext<Status> context = Mockito.mock(PollingContext.class);
        Map<String, String> data = new HashMap<>();
        Mockito.when(context.getData(Mockito.anyString()))
            .thenAnswer(invocation -> data.get(invocation.getArgument(0)));
        Mockito.when(context.setData(Mockito.anyString(), Mockito.anyString())).thenAnswer(invocation -> {
            data.put(invocation.getArgument(0), invocation.getArgument(1));
            return context;
        });
        Response<?> initial = Mockito.mock(Response.class);
        Mockito.when(initial.getHeaders())
            .thenReturn(new HttpHeaders().set("Operation-Location", "https://example.test/operations/wrong")
                .set("Location", "https://example.test/operations/correct%2Bid?api-version=1"));
        TypeReference<Status> type = new TypeReference<Status>() {
        };
        PollResponse<Status> response = new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, new DerivedStatus());
        Mockito.when(delegate.onInitialResponse(initial, context, type)).thenReturn(response);
        Mockito.when(delegate.poll(context, type)).thenReturn(response);

        SyncOperationIdPollingStrategy<Status, Void> strategy
            = new SyncOperationIdPollingStrategy<>(delegate, "/operations/{id}", "id", "location");
        Assertions.assertEquals("correct+id",
            strategy.onInitialResponse(initial, context, type).getValue().operationId);
        response.getValue().operationId = null;
        Assertions.assertEquals("correct+id", strategy.poll(context, type).getValue().operationId);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void asyncPollUsesBodyThenPathAndRetainsSelectedUrl() throws IOException {
        PollingStrategy<TranslationWithPathStatus, Void> delegate = Mockito.mock(PollingStrategy.class);
        PollingContext<TranslationWithPathStatus> context = Mockito.mock(PollingContext.class);
        Map<String, String> data = new HashMap<>();
        Mockito.when(context.getData(Mockito.anyString()))
            .thenAnswer(invocation -> data.get(invocation.getArgument(0)));
        Mockito.when(context.setData(Mockito.anyString(), Mockito.anyString())).thenAnswer(invocation -> {
            data.put(invocation.getArgument(0), invocation.getArgument(1));
            return context;
        });
        Response<?> initial = Mockito.mock(Response.class);
        Mockito.when(initial.getHeaders())
            .thenReturn(new HttpHeaders().set("Operation-Location", "https://example.test/operations/wrong")
                .set("Location", "https://example.test/operations/path-id"));
        TypeReference<TranslationWithPathStatus> type = new TypeReference<TranslationWithPathStatus>() {
        };
        TranslationWithPathStatus withoutId
            = TranslationWithPathStatus.fromJson(JsonProviders.createReader("{\"status\":\"Running\"}"));
        TranslationWithPathStatus withId = TranslationWithPathStatus
            .fromJson(JsonProviders.createReader("{\"id\":\"body-id\",\"status\":\"Failed\"}"));
        Mockito.when(delegate.onInitialResponse(initial, context, type))
            .thenReturn(Mono.just(new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, null)));
        Mockito.when(delegate.poll(context, type))
            .thenReturn(Mono.just(new PollResponse<>(LongRunningOperationStatus.IN_PROGRESS, withoutId)),
                Mono.just(new PollResponse<>(LongRunningOperationStatus.FAILED, withId)));

        OperationIdPollingStrategy<TranslationWithPathStatus, Void> strategy
            = new OperationIdPollingStrategy<>(delegate, "/operations/{id}", "id", "location");
        Assertions.assertNull(strategy.onInitialResponse(initial, context, type).block().getValue());
        Assertions.assertEquals("path-id", strategy.poll(context, type).block().getValue().getOperationId());
        Assertions.assertEquals("body-id", strategy.poll(context, type).block().getValue().getOperationId());
        Mockito.verify(delegate, Mockito.times(2)).poll(context, type);
    }
}
