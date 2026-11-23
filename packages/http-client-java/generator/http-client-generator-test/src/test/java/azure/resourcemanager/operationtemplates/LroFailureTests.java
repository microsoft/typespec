// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.operationtemplates;

import azure.resourcemanager.operationtemplates.fluent.models.OrderInner;
import azure.resourcemanager.operationtemplates.implementation.OperationTemplatesClientBuilder;
import azure.resourcemanager.operationtemplates.implementation.OperationTemplatesClientImpl;
import azure.resourcemanager.operationtemplates.models.ExportRequest;
import azure.resourcemanager.operationtemplates.models.OrderProperties;
import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.management.exception.ManagementException;
import com.azure.core.management.polling.PollResult;
import com.azure.core.management.profile.AzureProfile;
import com.azure.core.models.AzureCloud;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import com.azure.core.util.polling.AsyncPollResponse;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;

public class LroFailureTests {
    private static final String ERROR_BODY
        = "{\"error\":{\"code\":\"SkuNotAvailable\",\"message\":\"Requested SKU is unavailable.\"}}";
    private static final String FAILED_BODY
        = "{\"status\":\"Failed\",\"error\":{\"code\":\"SkuNotAvailable\",\"message\":\"Requested SKU is unavailable.\"}}";
    private static final String ORDER_BODY
        = "{\"name\":\"order1\",\"location\":\"eastus\",\"properties\":{\"amount\":1,\"productId\":\"product1\",\"provisioningState\":\"Succeeded\"}}";

    private static OperationTemplatesClientImpl client(int pollStatus, String pollBody, String pollHeader) {
        return new OperationTemplatesClientBuilder().subscriptionId("00000000-0000-0000-0000-000000000000")
            .defaultPollInterval(Duration.ofMillis(1))
            .pipeline(new HttpPipelineBuilder().httpClient(request -> {
                HttpHeaders headers = new HttpHeaders().set("Content-Type", "application/json").set("Retry-After", "0");
                int status;
                String body;
                if (request.getHttpMethod() != HttpMethod.GET) {
                    status = request.getHttpMethod() == HttpMethod.PUT ? 201 : 202;
                    body = "{\"properties\":{\"provisioningState\":\"Accepted\"}}";
                    headers.set(pollHeader, "https://management.azure.com/operations/repro");
                } else if (request.getUrl().getPath().equals("/operations/repro")) {
                    status = pollStatus;
                    body = pollBody;
                } else {
                    status = 200;
                    body = ORDER_BODY;
                }
                return Mono.just(new MockHttpResponse(request, status, headers, body.getBytes(StandardCharsets.UTF_8)));
            }).build())
            .buildClient();
    }

    private static OrderInner order() {
        return new OrderInner().withLocation("eastus")
            .withProperties(new OrderProperties().withAmount(1).withProductId("product1"));
    }

    private static void assertServiceError(ManagementException exception, int status) {
        Assertions.assertEquals("SkuNotAvailable", exception.getValue().getCode());
        Assertions.assertEquals("Requested SKU is unavailable.", exception.getValue().getMessage());
        Assertions.assertNotNull(exception.getResponse());
        Assertions.assertEquals(status, exception.getResponse().getStatusCode());
        Assertions.assertTrue(exception.getResponse().getBodyAsString().block().contains("SkuNotAvailable"));
    }

    @Test
    public void createThrowsForFailedStatusInSuccessfulHttpResponse() {
        OperationTemplatesClientImpl client = client(200, FAILED_BODY, "Azure-AsyncOperation");
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client.getLroes().createOrReplace("rg", "order1", order())), 200);
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client.getLroes().createOrReplace("rg", "order1", order(), Context.NONE)), 200);
    }

    @Test
    public void fluentCreateThrowsInsteadOfReturningBrokenModel() {
        OperationTemplatesClientImpl client = client(200, FAILED_BODY, "Azure-AsyncOperation");
        OperationTemplatesManager manager = OperationTemplatesManager.authenticate(client.getHttpPipeline(),
            new AzureProfile("", "00000000-0000-0000-0000-000000000000", AzureCloud.AZURE_PUBLIC_CLOUD));
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> manager.lroes()
                .define("order1")
                .withRegion("eastus")
                .withExistingResourceGroup("rg")
                .withProperties(new OrderProperties().withAmount(1).withProductId("product1"))
                .create()),
            200);
    }

    @Test
    public void postThrowsForFailedLocationPollingResponse() {
        OperationTemplatesClientImpl client = client(400, ERROR_BODY, "Location");
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client.getLroes().export("rg", "order1", new ExportRequest().withFormat("csv"))), 400);
        assertServiceError(
            Assertions.assertThrows(ManagementException.class,
                () -> client.getLroes().export("rg", "order1", new ExportRequest().withFormat("csv"), Context.NONE)),
            400);
    }

    @Test
    public void voidOperationThrowsForFailedPollingResponse() {
        OperationTemplatesClientImpl client = client(200, FAILED_BODY, "Azure-AsyncOperation");
        assertServiceError(
            Assertions.assertThrows(ManagementException.class, () -> client.getLroes().delete("rg", "order1")), 200);
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client.getLroes().delete("rg", "order1", Context.NONE)), 200);
    }

    @Test
    public void pageableOperationThrowsInsteadOfDereferencingNullResult() {
        OperationTemplatesClientImpl client = client(400, ERROR_BODY, "Location");
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client.getLroPagings().postPagingLro("rg", "product1").iterator().hasNext()), 400);
    }

    @Test
    public void beginPollerStillExposesFailureWithoutThrowing() {
        SyncPoller<PollResult<OrderInner>, OrderInner> poller
            = client(200, FAILED_BODY, "Azure-AsyncOperation").getLroes()
                .beginCreateOrReplace("rg", "order1", order(), Context.NONE);
        Assertions.assertEquals(LongRunningOperationStatus.FAILED, poller.waitForCompletion().getStatus());
        Assertions.assertNotNull(poller.poll().getValue().getError());
        Assertions.assertNull(poller.getFinalResult());
    }

    @Test
    public void successfulCreateStillFetchesFinalResource() {
        OperationTemplatesClientImpl client = client(200, "{\"status\":\"Succeeded\"}", "Azure-AsyncOperation");
        Assertions.assertEquals("order1",
            client.getLroes().createOrReplace("rg", "order1", order(), Context.NONE).name());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void canceledOperationWithoutPollValueThrowsInsteadOfFetchingResult() {
        SyncPoller<PollResult<OrderInner>, OrderInner> poller = Mockito.mock(SyncPoller.class);
        LongRunningOperationStatus status = LongRunningOperationStatus.fromString("Canceled", true);
        Mockito.when(poller.waitForCompletion()).thenReturn(new PollResponse<>(status, null));
        ManagementException exception = Assertions.assertThrows(ManagementException.class,
            () -> client(200, FAILED_BODY, "Azure-AsyncOperation").getLroFinalResultOrError(poller));
        Assertions.assertEquals(status.toString(), exception.getValue().getCode());
        Assertions.assertEquals("Long running operation failed.", exception.getValue().getMessage());
        Mockito.verify(poller, Mockito.never()).getFinalResult();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void missingOrMalformedErrorBodyUsesFallbackWithoutLosingResponse() {
        OperationTemplatesClientImpl client = client(200, FAILED_BODY, "Azure-AsyncOperation");
        for (String body : new String[] { null, "not-json" }) {
            SyncPoller<PollResult<OrderInner>, OrderInner> poller = Mockito.mock(SyncPoller.class);
            PollResult<OrderInner> result = new PollResult<>(
                new PollResult.Error("Polling failed.", 400, new HttpHeaders().set("x-ms-request-id", "repro"), body));
            Mockito.when(poller.waitForCompletion())
                .thenReturn(new PollResponse<>(LongRunningOperationStatus.FAILED, result));
            ManagementException exception
                = Assertions.assertThrows(ManagementException.class, () -> client.getLroFinalResultOrError(poller));
            Assertions.assertEquals(LongRunningOperationStatus.FAILED.toString(), exception.getValue().getCode());
            Assertions.assertEquals("Polling failed.", exception.getValue().getMessage());
            Assertions.assertEquals("repro", exception.getResponse().getHeaderValue("x-ms-request-id"));
            Assertions.assertEquals(body == null ? "" : body, exception.getResponse().getBodyAsString().block());
            Mockito.verify(poller, Mockito.never()).getFinalResult();
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    public void asyncCompletionStillPropagatesServiceError() {
        AsyncPollResponse<PollResult<OrderInner>, OrderInner> response = Mockito.mock(AsyncPollResponse.class);
        Mockito.when(response.getStatus()).thenReturn(LongRunningOperationStatus.FAILED);
        Mockito.when(response.getValue())
            .thenReturn(new PollResult<>(new PollResult.Error("Polling failed.", 200, new HttpHeaders(), FAILED_BODY)));
        assertServiceError(Assertions.assertThrows(ManagementException.class,
            () -> client(200, FAILED_BODY, "Azure-AsyncOperation").getLroFinalResultOrError(response)
                .block(Duration.ofSeconds(10))),
            200);
        Mockito.verify(response, Mockito.never()).getFinalResult();
    }
}
