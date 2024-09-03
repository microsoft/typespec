// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.usage;

import com.type.model.usage.models.InputOutputRecord;
import com.type.model.usage.models.InputRecord;
import com.type.model.usage.models.OutputRecord;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ModelsUsageClientTest {

    UsageClient client = new UsageClientBuilder().buildClient();

    @Test
    void input() {
        InputRecord inputRecord = new InputRecord("example-value");
        client.input(inputRecord);
    }

    @Test
    void output() {
        OutputRecord outputRecord = client.output();
        Assertions.assertEquals("example-value", outputRecord.getRequiredProp());
    }

    @Test
    void inputAndOutput() {
        InputOutputRecord inputOutputRecord = new InputOutputRecord("example-value");
        InputOutputRecord response = client.inputAndOutput(inputOutputRecord);
        Assertions.assertEquals("example-value", response.getRequiredProp());
    }
}