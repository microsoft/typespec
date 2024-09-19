// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.versioning.added;

import com.azure.core.util.BinaryData;
import com.versioning.added.models.EnumV1;
import com.versioning.added.models.EnumV2;
import com.versioning.added.models.ModelV1;
import com.versioning.added.models.ModelV2;
import org.junit.jupiter.api.Test;

public class AddedClientTests {
    private final AddedClient addedClient = new AddedClientBuilder()
            .endpoint("http://localhost:3000").version("v2").buildClient();
    private final InterfaceV2Client interfaceV2Client = new AddedClientBuilder()
            .endpoint("http://localhost:3000").version("v2").buildInterfaceV2Client();

    @Test
    public void testAddedClient() {
        addedClient.v1("bar", new ModelV1("foo", EnumV1.ENUM_MEMBER_V2, BinaryData.fromObject(10)));
        addedClient.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER, BinaryData.fromObject("bar")));
    }

    @Test
    public void testInterfaceV2Client() {
        interfaceV2Client.v2InInterface(new ModelV2("foo", EnumV2.ENUM_MEMBER, BinaryData.fromObject("bar")));
    }
}
