// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.lro.operationid;

import azure.clientgenerator.core.lro.operationid.models.DocumentAnalysisResult;
import azure.clientgenerator.core.lro.operationid.models.DocumentAnalysisStatus;
import azure.clientgenerator.core.lro.operationid.models.TranslationResult;
import azure.clientgenerator.core.lro.operationid.models.TranslationStatus;
import azure.clientgenerator.core.lro.operationid.models.TranslationWithPathStatus;
import com.azure.core.util.polling.AsyncPollResponse;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class OperationIdTests {
    @Test
    public void testAnalyze() {
        OperationIdClient client = new OperationIdClientBuilder().buildClient();
        SyncPoller<DocumentAnalysisStatus, DocumentAnalysisResult> poller = client.beginAnalyze("document-1");

        // operation ID from the path parameter of the polling URL, while the operation is in progress
        PollResponse<DocumentAnalysisStatus> response = poller.poll();
        Assertions.assertEquals(LongRunningOperationStatus.IN_PROGRESS, response.getStatus());
        Assertions.assertEquals("analysis-123", response.getValue().getOperationId());

        response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("analysis-123", response.getValue().getOperationId());
        Assertions.assertNotNull(poller.getFinalResult().getSummary());
    }

    @Test
    public void testAnalyzeAsync() {
        OperationIdAsyncClient client = new OperationIdClientBuilder().buildAsyncClient();
        AsyncPollResponse<DocumentAnalysisStatus, DocumentAnalysisResult> response
            = client.beginAnalyze("document-1").last().block();

        Assertions.assertNotNull(response);
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("analysis-123", response.getValue().getOperationId());
        Assertions.assertNotNull(response.getFinalResult().block());
    }

    @Test
    public void testStartTranslation() {
        OperationIdClient client = new OperationIdClientBuilder().buildClient();
        SyncPoller<TranslationStatus, TranslationResult> poller = client.beginStartTranslation();

        // operation ID from the "id" property of the status monitor response
        PollResponse<TranslationStatus> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("translation-123", response.getValue().getOperationId());
        Assertions.assertEquals(response.getValue().getId(), response.getValue().getOperationId());
        Assertions.assertNotNull(poller.getFinalResult());
    }

    // The Spector mock registers "translations:start" before "translations:start-with-path"; Express treats ":start"
    // as a route parameter, so the start-with-path request is served by the "start" handler.
    @Disabled("Spector mock route collision: 'translations:start' shadows 'translations:start-with-path'")
    @Test
    public void testStartTranslationWithPath() {
        OperationIdClient client = new OperationIdClientBuilder().buildClient();
        SyncPoller<TranslationWithPathStatus, TranslationResult> poller = client.beginStartTranslationWithPath();

        PollResponse<TranslationWithPathStatus> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("translation-456", response.getValue().getOperationId());
        Assertions.assertNotNull(poller.getFinalResult());
    }
}
