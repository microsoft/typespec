// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.util.Arrays;
import java.util.Collections;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class FluentUtilsTests {

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @Test
    public void testGetServiceName() {
        final String packageName = "com.azure.resourcemanager.appservice.generated";

        Assertions.assertEquals("Web", FluentUtils.getServiceNameFromClientName("WebManagementClient", packageName));

        Assertions.assertEquals("ResourceGraph",
            FluentUtils.getServiceNameFromClientName("ResourceGraphClient", packageName));

        Assertions.assertEquals("Appservice",
            CodeNamer.toPascalCase(FluentUtils.getServiceNameFromClientName("Web", packageName)));
    }

    @Test
    public void testGetArtifactId() {
        Assertions.assertEquals("azure-resourcemanager-appservice-generated",
            FluentUtils.getArtifactIdFromPackageName("com.azure.resourcemanager.appservice.generated"));

        Assertions.assertEquals("azure-resourcemanager-appservice",
            FluentUtils.getArtifactIdFromPackageName("com.azure.resourcemanager.appservice"));
    }

    @Test
    public void testSplitFlattenedSerializedName() {
        Assertions.assertEquals(Collections.singletonList("odata.properties"),
            FluentUtils.splitFlattenedSerializedName("odata.properties".replace(".", "\\\\.")));

        Assertions.assertEquals(Arrays.asList("properties", "virtualNetworkSubnetId"),
            FluentUtils.splitFlattenedSerializedName("properties.virtualNetworkSubnetId"));

        Assertions.assertEquals(Arrays.asList("odata.properties", "virtualNetworkSubnetId"), FluentUtils
            .splitFlattenedSerializedName("odata.properties".replace(".", "\\\\.") + ".virtualNetworkSubnetId"));
    }

    @Test
    public void testReservedClassName() {
        // other reserved name should already be handled by CodeNamer
        final String innerSuffix = "Inner";
        Assertions.assertEquals("ContextModel",
            FluentUtils.resourceModelInterfaceClassType("Context" + innerSuffix).getName());
        Assertions.assertEquals("ResponseModel",
            FluentUtils.resourceModelInterfaceClassType("Response" + innerSuffix).getName());
    }

    @Test
    public void testGetSingular() {
        // ves → f (shelves → shelf)
        Assertions.assertEquals("bookshelf", FluentUtils.getSingular("bookshelves"));

        // ves → fe (knives → knife)
        Assertions.assertEquals("knife", FluentUtils.getSingular("knives"));

        // ies → y (policies → policy)
        Assertions.assertEquals("policy", FluentUtils.getSingular("policies"));

        // (addresses → address)
        Assertions.assertEquals("address", FluentUtils.getSingular("addresses"));

        // (watches → watch)
        Assertions.assertEquals("watch", FluentUtils.getSingular("watches"));

        // xes → x (boxes → box)
        Assertions.assertEquals("box", FluentUtils.getSingular("boxes"));

        // regular s (books → book)
        Assertions.assertEquals("book", FluentUtils.getSingular("books"));

        // ss stays (class → class)
        Assertions.assertEquals("class", FluentUtils.getSingular("class"));

        // null returns null
        Assertions.assertNull(FluentUtils.getSingular(null));

        // already singular
        Assertions.assertEquals("child", FluentUtils.getSingular("child"));

        // irregular (children → child)
        Assertions.assertEquals("child", FluentUtils.getSingular("children"));

        // Azure resource style names
        Assertions.assertEquals("VirtualMachine", FluentUtils.getSingular("VirtualMachines"));
        Assertions.assertEquals("NetworkInterface", FluentUtils.getSingular("NetworkInterfaces"));
        Assertions.assertEquals("Factory", FluentUtils.getSingular("Factories"));
    }
}
