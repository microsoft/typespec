// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package versioning.added;

import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import versioning.added.models.EnumV1;
import versioning.added.models.EnumV2;
import versioning.added.models.ModelV1;
import versioning.added.models.ModelV2;

public class AddedClientTests {
    private final AddedClient addedClient = new AddedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(AddedServiceVersion.V2)
        .buildClient();
    private final InterfaceV2Client interfaceV2Client = new AddedClientBuilder().endpoint("http://localhost:3000")
        .serviceVersion(AddedServiceVersion.V2)
        .buildInterfaceV2Client();

    @Test
    public void testAddedClient() {
        addedClient.v1("bar", new ModelV1("foo", EnumV1.ENUM_MEMBER_V2, BinaryData.fromObject(10)));
        addedClient.v2(new ModelV2("foo", EnumV2.ENUM_MEMBER, BinaryData.fromObject("bar")));
    }

    @Test
    public void testInterfaceV2Client() {
        interfaceV2Client.v2InInterface(new ModelV2("foo", EnumV2.ENUM_MEMBER, BinaryData.fromObject("bar")));
    }

    @Test
    public void testModelMaximumOverloads() throws NoSuchMethodException {
        assertPublicMethod(AddedClient.class, "v1", String.class, ModelV1.class);
        assertPublicMethod(AddedClient.class, "v1WithResponse", String.class, ModelV1.class, RequestOptions.class);
        assertInternalMethod(AddedClient.class, "v1WithResponseInternal", String.class, BinaryData.class,
            RequestOptions.class);
        assertPublicMethod(AddedClient.class, "v2", ModelV2.class);
        assertPublicMethod(AddedClient.class, "v2WithResponse", ModelV2.class, RequestOptions.class);
        assertInternalMethod(AddedClient.class, "v2WithResponseInternal", BinaryData.class, RequestOptions.class);

        assertPublicMethod(AddedAsyncClient.class, "v1", String.class, ModelV1.class);
        assertPublicMethod(AddedAsyncClient.class, "v1WithResponse", String.class, ModelV1.class, RequestOptions.class);
        assertInternalMethod(AddedAsyncClient.class, "v1WithResponseInternal", String.class, BinaryData.class,
            RequestOptions.class);
        assertPublicMethod(AddedAsyncClient.class, "v2", ModelV2.class);
        assertPublicMethod(AddedAsyncClient.class, "v2WithResponse", ModelV2.class, RequestOptions.class);
        assertInternalMethod(AddedAsyncClient.class, "v2WithResponseInternal", BinaryData.class, RequestOptions.class);

        assertPublicMethod(InterfaceV2Client.class, "v2InInterface", ModelV2.class);
        assertPublicMethod(InterfaceV2Client.class, "v2InInterfaceWithResponse", ModelV2.class, RequestOptions.class);
        assertInternalMethod(InterfaceV2Client.class, "v2InInterfaceWithResponseInternal", BinaryData.class,
            RequestOptions.class);

        assertPublicMethod(InterfaceV2AsyncClient.class, "v2InInterface", ModelV2.class);
        assertPublicMethod(InterfaceV2AsyncClient.class, "v2InInterfaceWithResponse", ModelV2.class,
            RequestOptions.class);
        assertInternalMethod(InterfaceV2AsyncClient.class, "v2InInterfaceWithResponseInternal", BinaryData.class,
            RequestOptions.class);
    }

    private static void assertPublicMethod(Class<?> clientType, String methodName, Class<?>... parameterTypes)
        throws NoSuchMethodException {
        Method method = clientType.getDeclaredMethod(methodName, parameterTypes);
        Assertions.assertTrue(Modifier.isPublic(method.getModifiers()));
    }

    private static void assertInternalMethod(Class<?> clientType, String methodName, Class<?>... parameterTypes)
        throws NoSuchMethodException {
        Method method = clientType.getDeclaredMethod(methodName, parameterTypes);
        Assertions.assertFalse(Modifier.isPublic(method.getModifiers()));
    }
}
