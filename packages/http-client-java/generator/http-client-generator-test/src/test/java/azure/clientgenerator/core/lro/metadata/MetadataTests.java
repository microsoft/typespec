// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.lro.metadata;

import azure.clientgenerator.core.lro.metadata.models.ContentAnalysisResult;
import azure.clientgenerator.core.lro.metadata.models.ContentAnalysisStatus;
import azure.clientgenerator.core.lro.metadata.models.LanguageJobResult;
import azure.clientgenerator.core.lro.metadata.models.LanguageJobStatus;
import com.azure.core.exception.AzureException;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class MetadataTests {
    @Test
    public void testAnalyzeWithUsage() {
        MetadataClient client = new MetadataClientBuilder().buildClient();
        SyncPoller<ContentAnalysisStatus, ContentAnalysisResult> poller = client.beginAnalyzeWithUsage("analyzer-1");

        PollResponse<ContentAnalysisStatus> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("usage-123", response.getValue().getId());
        Assertions.assertEquals(1, response.getValue().getUsage().getDocumentPagesBasic());
        Assertions.assertEquals(Map.of("input", 10, "output", 4), response.getValue().getUsage().getTokens());
        Assertions.assertEquals("The document contains three sections.", poller.getFinalResult().getContents());
    }

    @Test
    public void testAnalyzeJob() {
        MetadataClient client = new MetadataClientBuilder().buildClient();
        SyncPoller<LanguageJobStatus, LanguageJobResult> poller = client.beginAnalyzeJob();

        PollResponse<LanguageJobStatus> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("job-success", response.getValue().getJobId());
        Assertions.assertEquals(3, response.getValue().getStatistics().getSucceeded());
        Assertions.assertEquals(List.of("document-1", "document-2", "document-3"),
            poller.getFinalResult().getDocuments());
    }

    @Test
    public void testAnalyzeJobWithFailure() {
        MetadataClient client = new MetadataClientBuilder().buildClient();
        SyncPoller<LanguageJobStatus, LanguageJobResult> poller = client.beginAnalyzeJobWithFailure();

        PollResponse<LanguageJobStatus> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.FAILED, response.getStatus());
        Assertions.assertEquals("job-failure", response.getValue().getJobId());
        Assertions.assertEquals(2, response.getValue().getStatistics().getFailed());
        Assertions.assertEquals("InvalidDocument", response.getValue().getErrors().get(0).getCode());
        Assertions.assertThrows(AzureException.class, poller::getFinalResult);
    }
}
