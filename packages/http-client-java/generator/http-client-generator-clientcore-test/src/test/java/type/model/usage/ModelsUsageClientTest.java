// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.usage;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ModelsUsageClientTest {

    private final UsageClient client = new UsageClientBuilder().buildClient();

    @Test
    public void input() {
        InputRecord inputRecord = new InputRecord("example-value");
        client.input(inputRecord);
    }

    @Test
    public void output() {
        OutputRecord outputRecord = client.output();
        Assertions.assertEquals("example-value", outputRecord.getRequiredProp());
    }

    @Test
    public void inputAndOutput() {
        InputOutputRecord inputOutputRecord = new InputOutputRecord("example-value");
        InputOutputRecord response = client.inputAndOutput(inputOutputRecord);
        Assertions.assertEquals("example-value", response.getRequiredProp());
    }
}
