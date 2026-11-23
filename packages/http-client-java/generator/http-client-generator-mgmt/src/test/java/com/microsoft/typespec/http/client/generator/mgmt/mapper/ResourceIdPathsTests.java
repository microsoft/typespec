// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import io.clientcore.core.http.models.HttpMethod;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class ResourceIdPathsTests {
    private static final String ROOT = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}"
        + "/providers/Microsoft.Test/plans/{planName}";
    private static final String ACCOUNT = "/subscriptions/{subscriptionId}/resourceGroups/{group}"
        + "/providers/Microsoft.Test/accounts/{accountName}/plans/{name}";
    private static final ClassType PLAN
        = new ClassType.Builder().packageName("com.azure.mock.fluent.models").name("PlanInner").build();
    private Client previousClient;

    @BeforeEach
    public void saveClient() {
        new TestUtils.MockFluentGen();
        previousClient = FluentStatic.getClient();
    }

    @AfterEach
    public void restoreClient() {
        FluentStatic.setClient(previousClient);
    }

    @Test
    public void collectsSharedRoutesAcrossCollectionsAndDeduplicatesTemplates() {
        Set<String> paths = resolve(
            List.of(method(PLAN, HttpMethod.GET, ROOT), method(GenericType.response(PLAN), HttpMethod.GET, ACCOUNT)),
            List.of(method(PLAN, HttpMethod.GET, ACCOUNT.replace("{name}", "{planName}")),
                method(GenericType.pagedIterable(PLAN), HttpMethod.GET, ACCOUNT.substring(0, ACCOUNT.lastIndexOf('/'))),
                method(PLAN, HttpMethod.POST, ROOT + "/action"),
                method(ClassType.STRING, HttpMethod.GET, "/other/{name}")));
        Assertions.assertEquals(Set.of(ROOT, ACCOUNT), paths);
    }

    @Test
    public void doesNotInferItemRoutesFromListsOrOtherModels() {
        String listPath = ACCOUNT.substring(0, ACCOUNT.lastIndexOf('/'));
        Set<String> paths = resolve(List.of(method(GenericType.pagedIterable(PLAN), HttpMethod.GET, listPath),
            method(new ClassType.Builder().packageName("com.azure.other.models").name(PLAN.getName()).build(),
                HttpMethod.GET, ACCOUNT),
            method(PLAN, HttpMethod.GET, ROOT + "/latest")));
        Assertions.assertEquals(Set.of(ROOT), paths);
    }

    @Test
    public void collectsItemRoutesFromWrites() {
        String nested = ACCOUNT.replace("/accounts/{accountName}", "/labs/{labName}/machines/{machineName}");
        Set<String> paths = resolve(List.of(method(PLAN, HttpMethod.PUT, ACCOUNT),
            method(GenericType.response(PLAN), HttpMethod.PATCH, nested)));
        Assertions.assertEquals(Set.of(ROOT, ACCOUNT, nested), paths);
    }

    @SafeVarargs
    private static Set<String> resolve(List<FluentCollectionMethod>... methods) {
        Client client = new Client.Builder().responseModels(List.of()).build();
        FluentStatic.setClient(client);
        FluentClient fluentClient = new FluentClient(client);
        FluentResourceModel model = mock(FluentResourceModel.class);
        ClientModel innerModel = new ClientModel.Builder().packageName(PLAN.getPackage()).name(PLAN.getName()).build();
        when(model.getInnerModel()).thenReturn(innerModel);
        when(model.getResourceIdPaths()).thenReturn(new LinkedHashSet<>());
        ResourceCreate create = mock(ResourceCreate.class);
        when(create.getUrlPathSegments()).thenReturn(new UrlPathSegments(ROOT));
        when(model.getResourceCreate()).thenReturn(create);
        fluentClient.getResourceModels().add(model);
        for (List<FluentCollectionMethod> collectionMethods : methods) {
            FluentResourceCollection collection = mock(FluentResourceCollection.class);
            when(collection.getMethods()).thenReturn(collectionMethods);
            fluentClient.getResourceCollections().add(collection);
        }
        ResourceParser.resolveResourceIdPaths(fluentClient);
        return model.getResourceIdPaths().stream().map(UrlPathSegments::getPath).collect(Collectors.toSet());
    }

    private static FluentCollectionMethod method(IType returnType, HttpMethod httpMethod, String path) {
        ProxyMethod proxy = new ProxyMethod.Builder().httpMethod(httpMethod).urlPath(path).build();
        ClientMethod innerMethod
            = new ClientMethod.Builder().parameters(List.of()).returnValue(new ReturnValue("", returnType)).build();
        FluentCollectionMethod method = mock(FluentCollectionMethod.class);
        when(method.getInnerClientMethod()).thenReturn(innerMethod);
        when(method.getInnerProxyMethod()).thenReturn(proxy);
        return method;
    }
}
