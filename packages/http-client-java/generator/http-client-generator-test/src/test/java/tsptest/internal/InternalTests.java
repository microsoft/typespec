// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.internal;

import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class InternalTests {

    @Test
    public void testInternalApiKeepsProtocolMethodName() throws NoSuchMethodException {
        InternalClient.class.getDeclaredMethod("getInternalWithResponse", RequestOptions.class);
        InternalAsyncClient.class.getDeclaredMethod("getInternalWithResponse", RequestOptions.class);
        InternalClient.class.getDeclaredMethod("postProtocalInternalWithResponse", BinaryData.class,
            RequestOptions.class);
        InternalAsyncClient.class.getDeclaredMethod("postProtocalInternalWithResponse", BinaryData.class,
            RequestOptions.class);

        Assertions.assertThrows(NoSuchMethodException.class,
            () -> InternalClient.class.getDeclaredMethod("getInternalWithResponseInternal", RequestOptions.class));
        Assertions.assertThrows(NoSuchMethodException.class,
            () -> InternalAsyncClient.class.getDeclaredMethod("getInternalWithResponseInternal", RequestOptions.class));
    }
}
