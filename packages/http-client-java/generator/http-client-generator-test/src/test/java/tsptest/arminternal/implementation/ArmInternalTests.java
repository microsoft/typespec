// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.arminternal.implementation;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import tsptest.arminternal.fluent.SecretsClient;
import tsptest.arminternal.fluent.WidgetsClient;
import tsptest.arminternal.fluent.models.SharedResultInner;
import tsptest.arminternal.implementation.models.InternalBase;
import tsptest.arminternal.implementation.models.InternalDetails;
import tsptest.arminternal.implementation.models.InternalKind;
import tsptest.arminternal.implementation.models.InternalRequest;
import tsptest.arminternal.implementation.models.InternalResult;
import tsptest.arminternal.implementation.models.InternalState;
import tsptest.arminternal.implementation.models.Secret;
import tsptest.arminternal.implementation.models.SecretProperties;
import tsptest.arminternal.models.Secrets;
import tsptest.arminternal.models.SharedResult;
import tsptest.arminternal.models.SharedState;
import tsptest.arminternal.models.Widgets;

public class ArmInternalTests {
    @Test
    public void internalOperationsAreAbsentFromBothPublicApiLayers() throws NoSuchMethodException {
        for (Class<?> type : List.of(WidgetsClient.class, Widgets.class)) {
            Assertions.assertTrue(Arrays.stream(type.getMethods()).noneMatch(m -> m.getName().startsWith("inspect")));
            type.getMethod("getByResourceGroup", String.class, String.class);
            type.getMethod("readShared", String.class, String.class);
        }
        Assertions.assertEquals(0, SecretsClient.class.getDeclaredMethods().length);
        Assertions.assertEquals(0, Secrets.class.getDeclaredMethods().length);
    }

    @Test
    public void internalMethodVariantsRemainInImplementationClasses() {
        for (Method method : WidgetsClientImpl.class.getDeclaredMethods()) {
            if (method.getName().startsWith("inspect")) {
                Assertions.assertFalse(Modifier.isPublic(method.getModifiers()), method.toString());
                Assertions.assertFalse(Modifier.isProtected(method.getModifiers()), method.toString());
            }
        }
        for (String name : List.of("inspect", "inspectAsync", "inspectWithResponse", "inspectWithResponseAsync")) {
            Assertions.assertTrue(
                Arrays.stream(WidgetsClientImpl.class.getDeclaredMethods()).anyMatch(m -> m.getName().equals(name)),
                name);
        }
        for (Method method : SecretsClientImpl.class.getDeclaredMethods()) {
            Assertions.assertFalse(Modifier.isPublic(method.getModifiers()), method.toString());
            Assertions.assertFalse(Modifier.isProtected(method.getModifiers()), method.toString());
        }
        for (String name : List.of("getByResourceGroup", "createOrUpdate", "createOrUpdateAsync", "beginCreateOrUpdate",
            "beginCreateOrUpdateAsync", "update", "listByResourceGroup", "listByResourceGroupAsync", "delete",
            "deleteAsync")) {
            Assertions.assertTrue(
                Arrays.stream(SecretsClientImpl.class.getDeclaredMethods()).anyMatch(m -> m.getName().equals(name)),
                name);
        }
        Assertions.assertTrue(Arrays.stream(WidgetsClientImpl.class.getDeclaredMethods())
            .filter(m -> m.getName().equals("inspectWithResponse"))
            .count() >= 2, "Retain the versioning/context overloads");
    }

    @Test
    public void internalTypesUseImplementationPackagesWithoutPublicFluentWrappers() {
        for (Class<?> type : List.of(InternalBase.class, InternalDetails.class, InternalKind.class,
            InternalRequest.class, InternalResult.class, InternalState.class, Secret.class, SecretProperties.class)) {
            Assertions.assertEquals("tsptest.arminternal.implementation.models", type.getPackage().getName());
        }
        Assertions.assertEquals("tsptest.arminternal.models", SharedState.class.getPackage().getName());
        Assertions.assertEquals("tsptest.arminternal.models", SharedResult.class.getPackage().getName());
        Assertions.assertEquals("tsptest.arminternal.fluent.models", SharedResultInner.class.getPackage().getName());
        for (String name : List.of("models.Secret", "fluent.models.SecretInner", "models.InternalResult",
            "fluent.models.InternalResultInner", "models.InternalKind", "models.InternalState")) {
            Assertions.assertThrows(ClassNotFoundException.class, () -> Class.forName("tsptest.arminternal." + name));
        }
    }

    @Test
    public void customizationCanInvokeInternalSyncAsyncAndVersionedMethods() {
        AtomicReference<HttpRequest> request = new AtomicReference<>();
        ArmInternalClientImpl client = new ArmInternalClientBuilder().endpoint("https://management.azure.com")
            .subscriptionId("00000000-0000-0000-0000-000000000000")
            .pipeline(new HttpPipelineBuilder().httpClient(httpRequest -> {
                request.set(httpRequest);
                return Mono.just(
                    new MockHttpResponse(httpRequest, 200, new HttpHeaders().set("Content-Type", "application/json"),
                        "{\"name\":\"hidden\",\"details\":{\"state\":\"Pending\",\"kind\":\"First\"}}"
                            .getBytes(StandardCharsets.UTF_8)));
            }).build())
            .buildClient();
        WidgetsClientImpl widgets = (WidgetsClientImpl) client.getWidgets();
        InternalRequest body = new InternalRequest()
            .withDetails(new InternalDetails().withState(InternalState.PENDING).withKind(InternalKind.FIRST));

        InternalResult result = widgets.inspect("test-rg", "widget", body);
        Assertions.assertEquals("hidden", result.name());
        Assertions.assertEquals(InternalState.PENDING, result.details().state());
        Assertions.assertEquals(InternalKind.FIRST, result.details().kind());
        Assertions.assertTrue(request.get().getUrl().getPath().endsWith("/widgets/widget/inspect"));
        Assertions.assertEquals("{\"details\":{\"state\":\"Pending\",\"kind\":\"First\"}}",
            request.get().getBodyAsBinaryData().toString());

        Assertions.assertEquals("hidden", widgets.inspectAsync("test-rg", "widget", body).block().name());
        Assertions.assertEquals(200,
            widgets.inspectWithResponse("test-rg", "widget", body, "verbose", Context.NONE).getStatusCode());
        Assertions.assertTrue(request.get().getUrl().getQuery().contains("detail=verbose"));
    }
}
