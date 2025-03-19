// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.structure;

import client.structure.anotherclientoperationgroup.subnamespace.SecondClientBuilder;
import client.structure.clientoperationgroup.FirstClientBuilder;
import client.structure.service.models.ClientType;
import org.junit.jupiter.api.Test;

public class ClientOperationGroupTests {

    @Test
    public void test() {
        FirstClientBuilder clientBuilder1
            = new FirstClientBuilder().endpoint("http://localhost:3000").client(ClientType.CLIENT_OPERATION_GROUP);
        SecondClientBuilder clientBuilder2
            = new SecondClientBuilder().endpoint("http://localhost:3000").client(ClientType.CLIENT_OPERATION_GROUP);

        clientBuilder1.buildClient().one();
        clientBuilder1.buildGroup3Client().two();
        clientBuilder1.buildGroup3Client().three();
        clientBuilder1.buildGroup4Client().four();

        clientBuilder2.buildClient().five();
        clientBuilder2.buildGroup5Client().six();
    }
}
