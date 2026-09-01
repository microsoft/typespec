// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.maxoverloadmodel;

import com.azure.core.http.rest.PagedFlux;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.util.BinaryData;
import com.azure.core.util.polling.PollerFlux;
import com.azure.core.util.polling.SyncPoller;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.maxoverloadmodel.models.GetResourceMetadataHeaders;
import tsptest.maxoverloadmodel.models.RequestModel;
import tsptest.maxoverloadmodel.models.RequestStatus;
import tsptest.maxoverloadmodel.models.ResourceModel;
import tsptest.maxoverloadmodel.models.ResponseModel;

public class MaxOverloadModelTests {

    @Test
    public void testModelWithResponseOverloads() throws NoSuchMethodException {
        Method currentMax = MaxOverloadModelClient.class.getDeclaredMethod("createWithResponse", String.class,
            RequestModel.class, String.class, String.class, RequestOptions.class);
        Method pastMax = MaxOverloadModelClient.class.getDeclaredMethod("createWithResponse", String.class,
            RequestModel.class, String.class, RequestOptions.class);

        Assertions.assertTrue(Modifier.isPublic(currentMax.getModifiers()));
        Assertions.assertTrue(Modifier.isPublic(pastMax.getModifiers()));
        Assertions.assertEquals("com.azure.core.http.rest.Response<" + ResponseModel.class.getName() + ">",
            currentMax.getGenericReturnType().getTypeName());
        Assertions.assertEquals(2, countPublicModelWithResponseMethods(MaxOverloadModelClient.class));

        Method protocolMethod = MaxOverloadModelClient.class.getDeclaredMethod("createWithResponseInternal",
            String.class, BinaryData.class, RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(protocolMethod.getModifiers()));

        Method asyncCurrentMax = MaxOverloadModelAsyncClient.class.getDeclaredMethod("createWithResponse", String.class,
            RequestModel.class, String.class, String.class, RequestOptions.class);
        Method asyncPastMax = MaxOverloadModelAsyncClient.class.getDeclaredMethod("createWithResponse", String.class,
            RequestModel.class, String.class, RequestOptions.class);
        Assertions.assertTrue(Modifier.isPublic(asyncCurrentMax.getModifiers()));
        Assertions.assertTrue(Modifier.isPublic(asyncPastMax.getModifiers()));
        Assertions.assertEquals(
            "reactor.core.publisher.Mono<com.azure.core.http.rest.Response<" + ResponseModel.class.getName() + ">>",
            asyncCurrentMax.getGenericReturnType().getTypeName());
        Assertions.assertEquals(2, countPublicModelWithResponseMethods(MaxOverloadModelAsyncClient.class));

        Method asyncProtocolMethod = MaxOverloadModelAsyncClient.class.getDeclaredMethod("createWithResponseInternal",
            String.class, BinaryData.class, RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(asyncProtocolMethod.getModifiers()));
    }

    @Test
    public void testLroAndPageableMethods() throws NoSuchMethodException {
        Method syncLro
            = MaxOverloadModelClient.class.getDeclaredMethod("beginCreateOrReplace", String.class, ResourceModel.class);
        Assertions.assertTrue(Modifier.isPublic(syncLro.getModifiers()));
        Assertions.assertEquals(SyncPoller.class, syncLro.getReturnType());

        Method syncProtocolLro = MaxOverloadModelClient.class.getDeclaredMethod("beginCreateOrReplace", String.class,
            BinaryData.class, RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(syncProtocolLro.getModifiers()));

        Method asyncLro = MaxOverloadModelAsyncClient.class.getDeclaredMethod("beginCreateOrReplace", String.class,
            ResourceModel.class);
        Assertions.assertTrue(Modifier.isPublic(asyncLro.getModifiers()));
        Assertions.assertEquals(PollerFlux.class, asyncLro.getReturnType());

        Method asyncProtocolLro = MaxOverloadModelAsyncClient.class.getDeclaredMethod("beginCreateOrReplace",
            String.class, BinaryData.class, RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(asyncProtocolLro.getModifiers()));

        Method syncPageable = MaxOverloadModelClient.class.getDeclaredMethod("list", String.class);
        Assertions.assertTrue(Modifier.isPublic(syncPageable.getModifiers()));
        Assertions.assertEquals(PagedIterable.class, syncPageable.getReturnType());

        Method syncProtocolPageable = MaxOverloadModelClient.class.getDeclaredMethod("list", RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(syncProtocolPageable.getModifiers()));

        Method asyncPageable = MaxOverloadModelAsyncClient.class.getDeclaredMethod("list", String.class);
        Assertions.assertTrue(Modifier.isPublic(asyncPageable.getModifiers()));
        Assertions.assertEquals(PagedFlux.class, asyncPageable.getReturnType());

        Method asyncProtocolPageable
            = MaxOverloadModelAsyncClient.class.getDeclaredMethod("list", RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(asyncProtocolPageable.getModifiers()));
    }

    @Test
    public void testResponseHeadersAsModel() throws NoSuchMethodException {
        Assertions.assertTrue(Modifier.isPublic(RequestStatus.class.getModifiers()));

        Method syncWithHeaders = MaxOverloadModelClient.class.getDeclaredMethod("getWithHeadersWithResponse",
            String.class, RequestOptions.class);
        Assertions.assertTrue(syncWithHeaders.getGenericReturnType()
            .getTypeName()
            .startsWith(
                "com.azure.core.http.rest.ResponseBase<tsptest.maxoverloadmodel.models.GetWithHeadersHeaders, "));

        Method asyncWithHeaders = MaxOverloadModelAsyncClient.class.getDeclaredMethod("getWithHeadersWithResponse",
            String.class, RequestOptions.class);
        Assertions.assertTrue(asyncWithHeaders.getGenericReturnType()
            .getTypeName()
            .startsWith(
                "reactor.core.publisher.Mono<com.azure.core.http.rest.ResponseBase<tsptest.maxoverloadmodel.models.GetWithHeadersHeaders, "));

        Method syncHead
            = MaxOverloadModelClient.class.getDeclaredMethod("getResourceMetadataWithResponse", RequestOptions.class);
        Assertions.assertTrue(Modifier.isPublic(syncHead.getModifiers()));
        Assertions.assertEquals("com.azure.core.http.rest.Response<" + GetResourceMetadataHeaders.class.getName() + ">",
            syncHead.getGenericReturnType().getTypeName());

        Method syncHeadProtocol = MaxOverloadModelClient.class
            .getDeclaredMethod("getResourceMetadataWithResponseInternal", RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(syncHeadProtocol.getModifiers()));

        Method asyncHead = MaxOverloadModelAsyncClient.class.getDeclaredMethod("getResourceMetadataWithResponse",
            RequestOptions.class);
        Assertions.assertTrue(Modifier.isPublic(asyncHead.getModifiers()));
        Assertions.assertEquals("reactor.core.publisher.Mono<com.azure.core.http.rest.Response<"
            + GetResourceMetadataHeaders.class.getName() + ">>", asyncHead.getGenericReturnType().getTypeName());

        Method asyncHeadProtocol = MaxOverloadModelAsyncClient.class
            .getDeclaredMethod("getResourceMetadataWithResponseInternal", RequestOptions.class);
        Assertions.assertFalse(Modifier.isPublic(asyncHeadProtocol.getModifiers()));
    }

    private static long countPublicModelWithResponseMethods(Class<?> clientType) {
        return Arrays.stream(clientType.getDeclaredMethods())
            .filter(method -> method.getName().equals("createWithResponse"))
            .filter(method -> Modifier.isPublic(method.getModifiers()))
            .filter(method -> method.getParameterTypes()[method.getParameterCount() - 1] == RequestOptions.class)
            .count();
    }
}
