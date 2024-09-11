// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.client.structure;

import com.client.structure.service.FirstClientBuilder;
import com.client.structure.service.subnamespace.SecondClientBuilder;
import org.junit.jupiter.api.Test;

public class ClientOperationGroupTests {

    @Test
    public void test() {
        FirstClientBuilder clientBuilder1 = new FirstClientBuilder()
                .endpoint("http://localhost:3000")
                .client("client-operation-group");
        SecondClientBuilder clientBuilder2 = new SecondClientBuilder()
                .endpoint("http://localhost:3000")
                .client("client-operation-group");

        clientBuilder1.buildClient().one();
        clientBuilder1.buildGroup3Client().two();
        clientBuilder1.buildGroup3Client().three();
        clientBuilder1.buildGroup4Client().four();

        clientBuilder2.buildClient().five();
        clientBuilder2.buildGroup5Client().six();
    }
}
