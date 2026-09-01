// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package specialwords;

import java.util.Collections;
import org.junit.jupiter.api.Test;

public class ReservedOperationBodyParamsClientTest {

    private final ReservedOperationBodyParamsClient client
        = new SpecialWordsClientBuilder().buildReservedOperationBodyParamsClient();

    @Test
    public void testWithItems() {
        client.withItems(Collections.singletonList("item"));
    }
}
