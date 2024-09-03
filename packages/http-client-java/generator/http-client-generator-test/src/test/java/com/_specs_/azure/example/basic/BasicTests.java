// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com._specs_.azure.example.basic;

import com._specs_.azure.example.basic.models.ActionRequest;
import com._specs_.azure.example.basic.models.ActionResponse;
import com._specs_.azure.example.basic.models.Enum;
import com._specs_.azure.example.basic.models.Model;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

public class BasicTests {

    private final AzureExampleClient client = new AzureExampleClientBuilder().httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS)).buildClient();

    @Test
    public void testBasicActionTests() {
        // method invocation
        ActionResponse response = client.basicAction("query", "header",
                new ActionRequest("text")
                        .setModelProperty(
                                new Model().setInt32Property(1).setFloat32Property(1.5D).setEnumProperty(Enum.ENUM_VALUE1))
                        .setArrayProperty(List.of("item"))
                        .setRecordProperty(Map.of("record", "value")));

        // response assertion
        Assertions.assertEquals("text", response.getStringProperty());
    }
}
