// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.protocolandconvenient;

import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ProtocolAndConvenientTests {

    @Test
    public void testHiddenProtocolMethodName() throws NoSuchMethodException {
        ProtocolAndConvenientClient.class.getDeclaredMethod("onlyConvenientWithResponseInternal", BinaryData.class,
            RequestOptions.class);
        ProtocolAndConvenientAsyncClient.class.getDeclaredMethod("onlyConvenientWithResponseInternal", BinaryData.class,
            RequestOptions.class);

        Assertions.assertThrows(NoSuchMethodException.class, () -> ProtocolAndConvenientClient.class
            .getDeclaredMethod("onlyConvenientWithResponse", BinaryData.class, RequestOptions.class));
        Assertions.assertThrows(NoSuchMethodException.class, () -> ProtocolAndConvenientAsyncClient.class
            .getDeclaredMethod("onlyConvenientWithResponse", BinaryData.class, RequestOptions.class));
    }
}
