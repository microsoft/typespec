// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.specialwords;

import org.junit.jupiter.api.Test;

public class OperationClientTest {

    private final OperationsClient client = new SpecialWordsClientBuilder().buildOperationsClient();

    @Test
    public void test() throws Exception {
        ReflectHelper.invokeWithResponseMethods(client.getClass(), client);
    }
}
