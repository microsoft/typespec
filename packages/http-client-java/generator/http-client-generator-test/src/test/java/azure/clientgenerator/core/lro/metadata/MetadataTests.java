// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.lro.metadata;

import azure.clientgenerator.core.lro.metadata.models.ContentAnalysisResult;
import azure.clientgenerator.core.lro.metadata.models.ContentAnalysisStatus;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
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
}
