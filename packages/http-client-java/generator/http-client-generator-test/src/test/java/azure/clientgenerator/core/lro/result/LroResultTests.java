// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.lro.result;

import azure.clientgenerator.core.lro.result.models.Job;
import azure.clientgenerator.core.lro.result.models.JobResult;
import azure.clientgenerator.core.lro.result.models.JobStatus;
import com.azure.core.exception.AzureException;
import com.azure.core.util.polling.AsyncPollResponse;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LroResultTests {
    private final ResultClient client = new ResultClientBuilder().buildClient();
    private final ResultAsyncClient asyncClient = new ResultClientBuilder().buildAsyncClient();

    @Test
    public void defaultResultReturnsCompleteResource() {
        Job result = client.beginCreateDefault("default", new Job(JobStatus.RUNNING)).getFinalResult();

        Assertions.assertEquals("default", result.getId());
        Assertions.assertEquals(JobStatus.SUCCEEDED, result.getStatus());
        Assertions.assertEquals("completed", result.getResult().getValue());
    }

    @Test
    public void clientResultReturnsSelectedProperty() {
        JobResult result
            = client.beginCreateWithClientLroResult("client-result", new Job(JobStatus.RUNNING)).getFinalResult();

        Assertions.assertEquals("completed", result.getValue());
    }

    @Test
    public void defaultResultReturnsCompleteResourceAsync() {
        AsyncPollResponse<Job, Job> response
            = asyncClient.beginCreateDefault("default", new Job(JobStatus.RUNNING)).blockLast();
        Job result = response.getFinalResult().block();

        Assertions.assertEquals("default", result.getId());
        Assertions.assertEquals(JobStatus.SUCCEEDED, result.getStatus());
        Assertions.assertEquals("completed", result.getResult().getValue());
    }

    @Test
    public void clientResultReturnsSelectedPropertyAsync() {
        AsyncPollResponse<Job, JobResult> response
            = asyncClient.beginCreateWithClientLroResult("client-result", new Job(JobStatus.RUNNING)).blockLast();
        JobResult result = response.getFinalResult().block();

        Assertions.assertEquals("completed", result.getValue());
    }

    @Test
    public void defaultResultWithFailure() {
        SyncPoller<Job, Job> poller = client.beginCreateDefaultFailure("default-failure", new Job(JobStatus.RUNNING));

        PollResponse<Job> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.FAILED, response.getStatus());
        Assertions.assertEquals("default-failure", response.getValue().getId());
        Assertions.assertEquals(JobStatus.FAILED, response.getValue().getStatus());
        Assertions.assertThrows(AzureException.class, poller::getFinalResult);
    }

    @Test
    public void clientResultWithFailure() {
        SyncPoller<Job, JobResult> poller
            = client.beginCreateClientResultFailure("client-result-failure", new Job(JobStatus.RUNNING));

        PollResponse<Job> response = poller.waitForCompletion();
        Assertions.assertEquals(LongRunningOperationStatus.FAILED, response.getStatus());
        Assertions.assertEquals("client-result-failure", response.getValue().getId());
        Assertions.assertEquals(JobStatus.FAILED, response.getValue().getStatus());
        Assertions.assertThrows(AzureException.class, poller::getFinalResult);
    }

    @Test
    public void defaultResultWithFailureAsync() {
        AsyncPollResponse<Job, Job> response
            = asyncClient.beginCreateDefaultFailure("default-failure", new Job(JobStatus.RUNNING)).blockLast();

        Assertions.assertEquals(LongRunningOperationStatus.FAILED, response.getStatus());
        Assertions.assertEquals(JobStatus.FAILED, response.getValue().getStatus());
        Assertions.assertThrows(AzureException.class, () -> response.getFinalResult().block());
    }

    @Test
    public void clientResultWithFailureAsync() {
        AsyncPollResponse<Job, JobResult> response
            = asyncClient.beginCreateClientResultFailure("client-result-failure", new Job(JobStatus.RUNNING))
                .blockLast();

        Assertions.assertEquals(LongRunningOperationStatus.FAILED, response.getStatus());
        Assertions.assertEquals(JobStatus.FAILED, response.getValue().getStatus());
        Assertions.assertThrows(AzureException.class, () -> response.getFinalResult().block());
    }
}
