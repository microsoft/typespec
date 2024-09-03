// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.specialwords;

import com.specialwords.models.SameAsModel;
import org.junit.jupiter.api.Test;

public class ModelPropertyClientTest {

    private final ModelPropertiesClient client = new SpecialWordsClientBuilder().buildModelPropertiesClient();

    @Test
    public void test() {
        client.sameAsModel(new SameAsModel("ok"));
    }
}
