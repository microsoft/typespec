// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package _specs_.azure.core.lro.rpc;

import _specs_.azure.core.lro.rpc.models.GenerationOptions;
import _specs_.azure.core.lro.rpc.models.GenerationResult;
import com.azure.core.util.polling.LongRunningOperationStatus;
import com.azure.core.util.polling.PollOperationDetails;
import com.azure.core.util.polling.PollResponse;
import com.azure.core.util.polling.SyncPoller;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class RpcTests {

    private final RpcClient client = new RpcClientBuilder().buildClient();

    @Test
    public void testRpc() {
        SyncPoller<PollOperationDetails, GenerationResult> poller
            = client.beginLongRunningRpc(new GenerationOptions("text"));

        PollResponse<PollOperationDetails> response = poller.waitForCompletion();

        Assertions.assertEquals(LongRunningOperationStatus.SUCCESSFULLY_COMPLETED, response.getStatus());
        Assertions.assertEquals("operation1", response.getValue().getOperationId());
        Assertions.assertNull(response.getValue().getError());

        GenerationResult finalResult = poller.getFinalResult();
        Assertions.assertEquals("text data", finalResult.getData());
    }
}
