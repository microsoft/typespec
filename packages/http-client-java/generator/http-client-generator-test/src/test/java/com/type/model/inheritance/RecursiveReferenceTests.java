// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.inheritance;

import com.type.model.inheritance.recursive.RecursiveClient;
import com.type.model.inheritance.recursive.RecursiveClientBuilder;
import com.type.model.inheritance.recursive.models.Extension;
import org.junit.jupiter.api.Test;

public class RecursiveReferenceTests {

    private final RecursiveClient client = new RecursiveClientBuilder().buildClient();

    @Test
    public void test() {
        Extension extension = client.get();
        client.put(extension);
    }
}
