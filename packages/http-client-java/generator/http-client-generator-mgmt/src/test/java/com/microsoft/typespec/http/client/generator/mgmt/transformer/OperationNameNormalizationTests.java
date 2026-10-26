// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import static com.microsoft.typespec.http.client.generator.mgmt.util.Utils.getJavaName;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

public class OperationNameNormalizationTests extends NormalizationTestBase {
    private static final String RESOURCE_PATH
        = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/widgets/{widgetName}";
    private static final String SUBSCRIPTION_LIST_PATH
        = "/subscriptions/{subscriptionId}/providers/Microsoft.Test/widgets";

    @ParameterizedTest
    @CsvSource({ "GET, getByResourceGroup", "gEt, getByResourceGroup", "DELETE, delete", "delete, delete" })
    public void normalizesResourceGetAndDeleteOperations(String method, String expected) {
        Operation operation = operation("originalName", method, RESOURCE_PATH);
        CodeModel model = model(operation);

        assertSame(model, new OperationNameNormalization().process(model));
        assertEquals(expected, getJavaName(operation));
        assertEquals("originalName", operation.getLanguage().getDefault().getName());
        assertEquals(RESOURCE_PATH, operation.getRequests().get(0).getProtocol().getHttp().getPath());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/widgets/{widgetName}",
            " ///SUBSCRIPTIONS/{subscriptionId}/RESOURCEGROUPS/{resourceGroupName}/PROVIDERS/Microsoft.Test/widgets/{widgetName}/// " })
    public void ignoresSurroundingWhitespaceSlashesAndFixedSegmentCasing(String path) {
        Operation operation = operation("readWidget", "GET", path);

        new OperationNameNormalization().process(model(operation));

        assertEquals("getByResourceGroup", getJavaName(operation));
        assertEquals(path, operation.getRequests().get(0).getProtocol().getHttp().getPath());
    }

    @ParameterizedTest
    @CsvSource({
        "/subscriptions/{subscriptionId}/providers/Microsoft.Test/widgets, list",
        "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/widgets, listByResourceGroup",
        "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/widgets, listByResourceGroup" })
    public void normalizesPageableSubscriptionAndResourceGroupLists(String path, String expected) {
        Operation operation = pagedOperation(path);

        new OperationNameNormalization().process(model(operation));

        assertEquals(expected, getJavaName(operation));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void doesNotRenameListsWithoutPageableMetadata(boolean emptyExtensions) {
        Operation operation = pagedOperation(SUBSCRIPTION_LIST_PATH);
        operation.setExtensions(emptyExtensions ? new XmsExtensions() : null);

        new OperationNameNormalization().process(model(operation));

        assertEquals("enumerateWidgets", getJavaName(operation));
    }

    @ParameterizedTest
    @CsvSource({ "items, true", "Value, true", "value, false" })
    public void requiresAnArrayPropertySerializedAsValue(String propertyName, boolean arrayProperty) {
        Operation operation = pagedOperation(SUBSCRIPTION_LIST_PATH);
        Property property = ((ObjectSchema) operation.getResponses().get(0).getSchema()).getProperties().get(0);
        property.setSerializedName(propertyName);
        if (!arrayProperty) {
            property.setSchema(new StringSchema());
        }

        new OperationNameNormalization().process(model(operation));

        assertEquals("enumerateWidgets", getJavaName(operation));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void doesNotRenameListsWithoutAnObjectResponse(boolean noResponse) {
        Operation operation = pagedOperation(SUBSCRIPTION_LIST_PATH);
        if (noResponse) {
            operation.getResponses().clear();
        } else {
            operation.getResponses().get(0).setSchema(new StringSchema());
        }

        new OperationNameNormalization().process(model(operation));

        assertEquals("enumerateWidgets", getJavaName(operation));
    }

    @ParameterizedTest
    @ValueSource(strings = { "POST", "PUT", "PATCH", "HEAD" })
    public void leavesUnsupportedHttpMethodsUnchanged(String method) {
        Operation operation = operation("originalName", method, RESOURCE_PATH);

        new OperationNameNormalization().process(model(operation));

        assertEquals("originalName", getJavaName(operation));
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "/providers/Microsoft.Test/widgets/{widgetName}",
            "/tenants/{tenantId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/widgets/{widgetName}",
            "/subscriptions/{subscriptionId}/locations/{location}/providers/Microsoft.Test/widgets/{widgetName}",
            "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/extensions/Microsoft.Test/widgets/{widgetName}" })
    public void leavesNonmatchingResourcePathsUnchanged(String path) {
        Operation operation = operation("readWidget", "GET", path);

        new OperationNameNormalization().process(model(operation));

        assertEquals("readWidget", getJavaName(operation));
    }

    @Test
    public void suppressesOnlyRenamesThatConflictWithExistingOperationNames() {
        Operation read = operation("readWidget", "GET", RESOURCE_PATH);
        Operation existing = operation("getByResourceGroup", "POST", "/custom");
        Operation delete = operation("removeWidget", "DELETE", RESOURCE_PATH);

        new OperationNameNormalization().process(model(read, existing, delete));

        assertEquals("readWidget", getJavaName(read));
        assertEquals("getByResourceGroup", getJavaName(existing));
        assertEquals("delete", getJavaName(delete));
    }

    @ParameterizedTest
    @ValueSource(strings = { "readFirst", "getByResourceGroup" })
    public void onlyAssignsEachWellKnownNameToTheFirstCandidate(String firstName) {
        Operation first = operation(firstName, "GET", RESOURCE_PATH);
        Operation second = operation("readSecond", "GET", RESOURCE_PATH);

        new OperationNameNormalization().process(model(first, second));

        assertEquals("getByResourceGroup", getJavaName(first));
        assertEquals("readSecond", getJavaName(second));
    }

    @Test
    public void assignsWellKnownNamesIndependentlyInEachOperationGroup() {
        Operation first = operation("readFirst", "GET", RESOURCE_PATH);
        Operation second = operation("readSecond", "GET", RESOURCE_PATH);
        CodeModel model = model(first);
        model.getOperationGroups().addAll(model(second).getOperationGroups());

        new OperationNameNormalization().process(model);

        assertEquals("getByResourceGroup", getJavaName(first));
        assertEquals("getByResourceGroup", getJavaName(second));
    }

    @Test
    public void updatesConvenienceNamesWithoutChangingDefaultLanguageNames() {
        Operation operation = operation("readWidget", "GET", RESOURCE_PATH);
        operation.setConvenienceApi(named(new ConvenienceApi(), "readWidgetConvenience"));

        new OperationNameNormalization().process(model(operation));

        assertEquals("getByResourceGroup", getJavaName(operation));
        assertEquals("getByResourceGroup", getJavaName(operation.getConvenienceApi()));
        assertEquals("readWidget", operation.getLanguage().getDefault().getName());
        assertEquals("readWidgetConvenience", operation.getConvenienceApi().getLanguage().getDefault().getName());
    }

    @ParameterizedTest
    @ValueSource(strings = { "GET", "DELETE" })
    public void reordersResourcePathParametersInEveryRequestWithoutMovingOtherParameters(String method) {
        Operation operation = operation("originalName", method, RESOURCE_PATH);
        operation.getRequests().add(request(method, RESOURCE_PATH));
        for (Request request : operation.getRequests()) {
            Parameter subscription = parameter("subscriptionId", RequestParameterLocation.PATH);
            subscription.setImplementation(Parameter.ImplementationLocation.CLIENT);
            Parameter widget = parameter("widgetName", RequestParameterLocation.PATH);
            Parameter resourceGroup = parameter("resourceGroupName", RequestParameterLocation.PATH);
            Parameter query = parameter("api-version", RequestParameterLocation.QUERY);
            Parameter noProtocol = parameter("noProtocol", RequestParameterLocation.QUERY);
            noProtocol.setProtocol(null);
            Parameter noHttp = parameter("noHttp", RequestParameterLocation.QUERY);
            noHttp.setProtocol(new Protocols());
            request.getParameters().addAll(List.of(subscription, widget, query, noProtocol, noHttp, resourceGroup));
        }
        List<List<Parameter>> expected = new ArrayList<>();
        for (Request request : operation.getRequests()) {
            List<Parameter> parameters = request.getParameters();
            expected.add(List.of(parameters.get(0), parameters.get(5), parameters.get(2), parameters.get(3),
                parameters.get(4), parameters.get(1)));
        }

        new OperationNameNormalization().process(model(operation));

        for (int i = 0; i < operation.getRequests().size(); i++) {
            assertEquals(expected.get(i), operation.getRequests().get(i).getParameters());
        }
    }

    @ParameterizedTest
    @MethodSource("unchangedPathParameterOrders")
    public void leavesParameterOrderUnchangedWhenNoUnambiguousSwapIsPossible(List<Parameter> parameters) {
        Operation operation = operation("readWidget", "GET", RESOURCE_PATH);
        operation.getRequests().get(0).getParameters().addAll(parameters);

        new OperationNameNormalization().process(model(operation));

        assertEquals(parameters, operation.getRequests().get(0).getParameters());
    }

    private static Stream<List<Parameter>> unchangedPathParameterOrders() {
        return Stream.of(
            List.of(parameter("resourceGroupName", RequestParameterLocation.PATH),
                parameter("widgetName", RequestParameterLocation.PATH)),
            List.of(parameter("widgetName", RequestParameterLocation.PATH),
                parameter("extra", RequestParameterLocation.PATH),
                parameter("resourceGroupName", RequestParameterLocation.PATH)),
            List.of(parameter("widgetName", RequestParameterLocation.PATH),
                parameter("otherName", RequestParameterLocation.PATH)),
            List.of(parameter("otherName", RequestParameterLocation.PATH),
                parameter("resourceGroupName", RequestParameterLocation.PATH)));
    }

    @Test
    public void normalizationIsIdempotent() {
        Operation operation = operation("readWidget", "GET", RESOURCE_PATH);
        Parameter widget = parameter("widgetName", RequestParameterLocation.PATH);
        Parameter resourceGroup = parameter("resourceGroupName", RequestParameterLocation.PATH);
        operation.getRequests().get(0).getParameters().addAll(List.of(widget, resourceGroup));
        CodeModel model = model(operation);
        OperationNameNormalization normalization = new OperationNameNormalization();

        normalization.process(model);
        normalization.process(model);

        assertEquals("getByResourceGroup", getJavaName(operation));
        assertEquals(List.of(resourceGroup, widget), operation.getRequests().get(0).getParameters());
    }

    private static Operation pagedOperation(String path) {
        Operation operation = operation("enumerateWidgets", "GET", path);
        XmsExtensions extensions = new XmsExtensions();
        extensions.setXmsPageable(new XmsPageable());
        operation.setExtensions(extensions);
        Property property = new Property();
        property.setSerializedName("value");
        ArraySchema array = new ArraySchema();
        array.setElementType(new StringSchema());
        property.setSchema(array);
        ObjectSchema schema = new ObjectSchema();
        schema.getProperties().add(property);
        Response response = new Response();
        response.setSchema(schema);
        operation.getResponses().add(response);
        return operation;
    }

    private static Parameter parameter(String serializedName, RequestParameterLocation location) {
        Parameter parameter = named(new Parameter(), serializedName);
        parameter.getLanguage().getDefault().setSerializedName(serializedName);
        parameter.getLanguage().getJava().setSerializedName("java_" + serializedName);
        parameter.setImplementation(Parameter.ImplementationLocation.METHOD);
        Protocol http = new Protocol();
        http.setIn(location);
        parameter.setProtocol(protocol(http));
        return parameter;
    }
}
