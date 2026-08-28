// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.apiversion.clientapiversions;

import org.junit.jupiter.api.Test;

public class ClientApiVersionsTests {

    @Test
    public void sendExtendedClientApiVersion() {
        ClientApiVersionsClient client
            = new ClientApiVersionsClientBuilder().serviceVersion(ClientApiVersionsServiceVersion.V2022_10_01)
                .buildClient();

        client.sendApiVersion();
    }
}
