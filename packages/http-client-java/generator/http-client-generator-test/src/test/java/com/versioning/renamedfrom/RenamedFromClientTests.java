// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.renamedfrom;

import com.azure.core.util.BinaryData;
import com.versioning.renamedfrom.models.NewEnum;
import com.versioning.renamedfrom.models.NewModel;
import org.junit.jupiter.api.Test;

public class RenamedFromClientTests {
    private final RenamedFromClient renamedFromClient = new RenamedFromClientBuilder()
            .endpoint("http://localhost:3000").version("v2").buildClient();
    private final NewInterfaceClient newInterfaceClient = new RenamedFromClientBuilder()
            .endpoint("http://localhost:3000").version("v2").buildNewInterfaceClient();

    @Test
    public void testNewOp() {
        renamedFromClient.newOp("bar", new NewModel("foo", NewEnum.NEW_ENUM_MEMBER, BinaryData.fromObject(10)));
    }

    @Test
    public void testNewOpInNewInterface() {
        newInterfaceClient.newOpInNewInterface(new NewModel("foo", NewEnum.NEW_ENUM_MEMBER, BinaryData.fromObject(10)));
    }
}
