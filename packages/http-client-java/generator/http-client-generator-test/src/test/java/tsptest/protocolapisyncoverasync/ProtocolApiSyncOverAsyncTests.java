// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.protocolapisyncoverasync;

import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Test;

public class ProtocolApiSyncOverAsyncTests {

    @Test
    public void testHiddenProtocolMethodName() throws NoSuchMethodException {
        ProtocolApiSyncOverAsyncClient.class.getDeclaredMethod("createWithResponseInternal", BinaryData.class,
            RequestOptions.class);
        ProtocolApiSyncOverAsyncAsyncClient.class.getDeclaredMethod("createWithResponseInternal", BinaryData.class,
            RequestOptions.class);
        ProtocolApiSyncOverAsyncClient.class.getDeclaredMethod("listInternal", String.class, RequestOptions.class);
        ProtocolApiSyncOverAsyncAsyncClient.class.getDeclaredMethod("listInternal", String.class, RequestOptions.class);
    }
}
