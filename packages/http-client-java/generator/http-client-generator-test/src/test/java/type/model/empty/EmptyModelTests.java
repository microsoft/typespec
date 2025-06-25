// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.empty;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.model.empty.models.EmptyInput;
import type.model.empty.models.EmptyInputOutput;
import type.model.empty.models.EmptyOutput;

public class EmptyModelTests {

    private final EmptyClient client = new EmptyClientBuilder().buildClient();

    @Test
    public void testEmptyModel() {
        EmptyOutput output = client.getEmpty();
        Assertions.assertNotNull(output);

        client.putEmpty(new EmptyInput());

        EmptyInputOutput inputOutput = client.postRoundTripEmpty(new EmptyInputOutput());
        Assertions.assertNotNull(inputOutput);
    }
}
