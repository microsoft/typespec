// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.azure.core.util.logging.ClientLogger;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentConstructorByInner;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodType;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated("Fluent generation uses shared settings")
public class ResourceManagerUtilsTests {
    private static final String TEMPLATE = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}"
        + "/providers/Microsoft.Test/services/{serviceResourceName}";
    private static final String ID
        = "/subscriptions/sub/resourceGroups/services" + "/providers/Microsoft.Test/services/farm";

    @TempDir
    static Path compilationDirectory;
    private static URLClassLoader classLoader;
    private static Method parse;

    @BeforeAll
    public static void compileGeneratedHelper() throws Exception {
        new TestUtils.MockFluentGen();
        JavaFile file = new JavaFile("ResourceManagerUtils.java");
        ResourceManagerUtilsTemplate.getInstance()
            .write(EnumSet.allOf(ResourceManagerUtilsTemplate.UtilityMethod.class), file);
        Path source = compilationDirectory.resolve("ResourceManagerUtils.java");
        Files.writeString(source, file.getContents().toString());
        compile(source);
        classLoader = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() },
            ResourceManagerUtilsTests.class.getClassLoader());
        parse = classLoader.loadClass("ResourceManagerUtils")
            .getDeclaredMethod("getValueFromIdByParameterName", String.class, String.class, String.class);
        parse.setAccessible(true);
    }

    private static void compile(Path... sources) {
        List<String> arguments = new ArrayList<>(List.of("-classpath",
            compilationDirectory + File.pathSeparator
                + System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")),
            "-d", compilationDirectory.toString()));
        for (Path source : sources) {
            arguments.add(source.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, arguments.toArray(new String[0]));
        Assertions.assertEquals(0, result, diagnostics.toString(StandardCharsets.UTF_8));
    }

    @AfterAll
    public static void closeClassLoader() throws Exception {
        if (classLoader != null) {
            classLoader.close();
        }
    }

    private static String value(String id, String template, String parameter) throws Exception {
        return (String) parse.invoke(null, id, template, parameter);
    }

    @ParameterizedTest
    @ValueSource(strings = { "", "getValueFromIdByParameterName", "getRequiredValueFromIdByParameterName", "mapPage" })
    public void emitsOnlyReferencedUtilities(String method, @TempDir Path directory) throws Exception {
        FluentJavaPackage javaPackage = new FluentJavaPackage(new TestUtils.MockFluentGen());
        JavaFile caller = new JavaFile("Caller.java");
        caller.line(method.isEmpty()
            ? "class Caller {}"
            : "class Caller { void call() { ResourceManagerUtils." + method + "(); } }");
        javaPackage.getJavaFiles().add(caller);
        javaPackage.addResourceManagerUtils();
        var helper = javaPackage.getJavaFiles()
            .stream()
            .filter(file -> file.getFilePath().endsWith("ResourceManagerUtils.java"))
            .findFirst();
        if (method.isEmpty()) {
            Assertions.assertTrue(helper.isEmpty());
            return;
        }
        String source = helper.orElseThrow().getContents().toString();
        boolean required = method.equals("getRequiredValueFromIdByParameterName");
        Assertions.assertEquals(!method.equals("mapPage"), source.contains("String getValueFromIdByParameterName("));
        Assertions.assertEquals(required, source.contains("String getRequiredValueFromIdByParameterName("));
        Assertions.assertEquals(method.equals("mapPage"), source.contains("PagedIterable<S> mapPage("));
        Assertions.assertEquals(method.equals("mapPage"), source.contains("class PagedIterableImpl"));
        Assertions.assertEquals(required, source.contains("import com.azure.core.util.logging.ClientLogger;"));
        Path file = directory.resolve("ResourceManagerUtils.java");
        Files.writeString(file, source);
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                directory.toString(), file.toString());
        Assertions.assertEquals(0, result, diagnostics.toString(StandardCharsets.UTF_8));
    }

    @Test
    public void requiredParameterPreservesValuesAndValidationErrors() throws Exception {
        Method required = classLoader.loadClass("ResourceManagerUtils")
            .getDeclaredMethod("getRequiredValueFromIdByParameterName", String.class, String.class, String.class,
                String.class, ClientLogger.class);
        required.setAccessible(true);
        ClientLogger logger = new ClientLogger(ResourceManagerUtilsTests.class);
        Assertions.assertEquals("farm", required.invoke(null, ID, TEMPLATE, "serviceResourceName", "services", logger));
        for (String id : new String[] { null, ID.replace("Microsoft.Test", "Other"), ID + "/extra" }) {
            InvocationTargetException error = Assertions.assertThrows(InvocationTargetException.class,
                () -> required.invoke(null, id, TEMPLATE, "resourceGroupName", "resourceGroups", logger));
            Assertions.assertInstanceOf(IllegalArgumentException.class, error.getCause());
            Assertions.assertEquals("The resource ID '" + id + "' is not valid. Missing path segment 'resourceGroups'.",
                error.getCause().getMessage());
        }
        String tenantTemplate = "/{scope}/providers/Microsoft.Authorization/roleAssignments/{name}";
        Assertions.assertEquals("", required.invoke(null, "/providers/Microsoft.Authorization/roleAssignments/item",
            tenantTemplate, "scope", "scope", logger));
    }

    @Test
    public void generatedWrapperResolvesAlternateRouteBeforeEnumConversion() throws Exception {
        EnumType enumType = new EnumType.Builder().packageName("")
            .name("ResourceName")
            .elementType(ClassType.STRING)
            .values(List.of(new ClientEnumValue("FARM", "farm")))
            .build();
        JavaFile enumFile = new JavaFile("ResourceName.java");
        EnumTemplate.getInstance().write(enumType, enumFile);
        Path enumSource = compilationDirectory.resolve("ResourceName.java");
        Files.writeString(enumSource, enumFile.getContents().toString());

        UrlPathSegments primary = new UrlPathSegments(TEMPLATE);
        UrlPathSegments alternate = new UrlPathSegments(
            TEMPLATE.replace("/services/{serviceResourceName}", "/accounts/{accountName}/services/{name}"));
        FluentResourceModel model = mock(FluentResourceModel.class);
        when(model.getImplementationType())
            .thenReturn(new ClassType.Builder().packageName("").name("SharedResourceImpl").build());
        when(model.getInnerModel()).thenReturn(new ClientModel.Builder().name("Inner").build());
        when(model.getResourceIdPaths()).thenReturn(Set.of(primary, alternate));
        ClientMethodParameter parameter
            = new ClientMethodParameter.Builder().name("resourceName").wireType(enumType).build();
        ProxyMethodParameter proxyParameter
            = new ProxyMethodParameter.Builder().requestParameterName("serviceResourceName").build();
        ResourceLocalVariables variables = mock(ResourceLocalVariables.class);
        when(variables.getLocalVariableByMethodParameter(parameter))
            .thenReturn(new LocalVariable("resourceName", enumType, RequestParameterLocation.PATH, parameter));
        FluentConstructorByInner constructor = new FluentConstructorByInner(model, FluentMethodType.CONSTRUCTOR,
            List.of(new MethodParameter(proxyParameter, parameter)), variables, ClassType.OBJECT, primary);
        JavaFile wrapperFile = new JavaFile("SharedResourceImpl.java");
        wrapperFile.publicFinalClass("SharedResourceImpl", wrapper -> {
            wrapper.privateMemberVariable("Inner", "innerObject");
            wrapper.privateMemberVariable("Object", "serviceManager");
            wrapper.privateMemberVariable("ResourceName", "resourceName");
            constructor.getMethodTemplate().writeMethod(wrapper);
            wrapper.publicStaticMethod("ResourceName parseResourceName(String id)",
                block -> block.methodReturn("new SharedResourceImpl(new Inner(id), new Object()).resourceName"));
            wrapper.privateStaticFinalClass("Inner", inner -> {
                inner.privateMemberVariable("String", "id");
                inner.privateConstructor("Inner(String id)", block -> block.line("this.id = id;"));
                inner.publicMethod("String id()", block -> block.methodReturn("this.id"));
            });
        });
        Path wrapperSource = compilationDirectory.resolve("SharedResourceImpl.java");
        Files.writeString(wrapperSource, wrapperFile.getContents().toString());
        compile(enumSource, wrapperSource);

        Method parseName = classLoader.loadClass("SharedResourceImpl").getMethod("parseResourceName", String.class);
        Object expected = classLoader.loadClass("ResourceName").getField("FARM").get(null);
        Assertions.assertSame(expected, parseName.invoke(null, ID));
        Assertions.assertSame(expected,
            parseName.invoke(null, ID.replace("/services/farm", "/accounts/account/services/farm")));
    }

    @Test
    public void resolvesResourceGroupTypeCollision() throws Exception {
        Assertions.assertEquals("sub", value(ID, TEMPLATE, "subscriptionId"));
        Assertions.assertEquals("services", value(ID, TEMPLATE, "resourceGroupName"));
        Assertions.assertEquals("farm", value(ID, TEMPLATE, "serviceResourceName"));
        Assertions.assertEquals("farm",
            value(ID.replace("resourceGroups/services", "resourceGroups/ordinary"), TEMPLATE, "serviceResourceName"));
    }

    @Test
    public void matchesArmLiteralsIgnoringCase() throws Exception {
        Assertions.assertEquals("farm",
            value(ID.replace("resourceGroups", "RESOURCEGROUPS").replace("Microsoft.Test", "microsoft.test"), TEMPLATE,
                "serviceResourceName"));
    }

    @Test
    public void resolvesNestedAndRepeatedTypes() throws Exception {
        String template = "/subscriptions/{subscriptionId}/providers/Microsoft.Test/parents/{parentName}"
            + "/children/{childName}/parents/{grandchildName}";
        String id = "/subscriptions/sub/providers/Microsoft.Test/parents/p1/children/parents/parents/g1";
        Assertions.assertEquals("p1", value(id, template, "parentName"));
        Assertions.assertEquals("parents", value(id, template, "childName"));
        Assertions.assertEquals("g1", value(id, template, "grandchildName"));
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "subscriptions/sub",
            "subscriptions/sub/resourceGroups/rg",
            "providers/Microsoft.Management/managementGroups/group",
            "subscriptions/sub/resourceGroups/rg/providers/Microsoft.Test/parents/p1",
            "tenant" })
    public void preservesVariableLengthScopes(String scope) throws Exception {
        String template = "/{scope}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}";
        String id = "/" + scope + "/providers/Microsoft.Authorization/roleAssignments/assignment";
        Assertions.assertEquals(scope, value(id, template, "scope"));
        Assertions.assertEquals("assignment", value(id, template, "roleAssignmentName"));
        Assertions.assertEquals(scope, value(id.substring(1), template.substring(1), "scope"));
    }

    @Test
    public void resolvesExtensionResources() throws Exception {
        String template
            = "/{resourceUri}/providers/Microsoft.Advisor/recommendations/{recommendationId}" + "/suppressions/{name}";
        String scope = "subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        String id = "/" + scope + "/providers/Microsoft.Advisor/recommendations/recommendation1/suppressions/name1";
        Assertions.assertEquals(scope, value(id, template, "resourceUri"));
        Assertions.assertEquals("recommendation1", value(id, template, "recommendationId"));
        Assertions.assertEquals("name1", value(id, template, "name"));
    }

    @Test
    public void preservesEmptyTenantScope() throws Exception {
        String template = "/{scope}/providers/Microsoft.Authorization/roleAssignments/{name}";
        String id = "/providers/Microsoft.Authorization/roleAssignments/assignment";
        Assertions.assertEquals("", value(id, template, "scope"));
        Assertions.assertEquals("assignment", value(id, template, "name"));
        Assertions.assertEquals("", value(id.substring(1), template.substring(1), "scope"));
        Assertions.assertEquals("assignment", value(id.substring(1), template.substring(1), "name"));
    }

    @Test
    public void resolvesFixedScopes() throws Exception {
        Assertions.assertEquals("group", value("/providers/Microsoft.Management/managementGroups/group",
            "/providers/Microsoft.Management/managementGroups/{groupId}", "groupId"));
        Assertions.assertEquals("sub",
            value("/subscriptions/sub", "/subscriptions/{subscriptionId}", "subscriptionId"));
        Assertions.assertEquals("rg", value("/subscriptions/sub/resourceGroups/rg",
            "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}", "resourceGroupName"));
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "/subscriptions/sub/resourceGroups/services/providers/Microsoft.Other/services/farm",
            "/subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/other/farm",
            "/subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/services",
            "/subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/services/",
            "/subscriptions/sub/resourceGroups//providers/Microsoft.Test/services/farm",
            "/subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/services/farm/extra",
            "/extra/subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/services/farm",
            "//subscriptions/sub/resourceGroups/services/providers/Microsoft.Test/services/farm",
            "" })
    public void rejectsIncompatibleIdsBeforeReturningAnyParameter(String id) throws Exception {
        Assertions.assertNull(value(id, TEMPLATE, "subscriptionId"));
        Assertions.assertNull(value(id, TEMPLATE, "resourceGroupName"));
        Assertions.assertNull(value(id, TEMPLATE, "serviceResourceName"));
    }

    @Test
    public void rejectsInvalidScopeSuffix() throws Exception {
        String template = "/{scope}/providers/Microsoft.Authorization/roleAssignments/{name}";
        Assertions
            .assertNull(value("/subscriptions/sub/providers/Microsoft.Other/roleAssignments/name", template, "name"));
        Assertions.assertNull(value("//providers/Microsoft.Authorization/roleAssignments/name", template, "scope"));
    }

    @Test
    public void returnsNullForMissingInputsOrParameters() throws Exception {
        Assertions.assertNull(value(null, TEMPLATE, "subscriptionId"));
        Assertions.assertNull(value(ID, null, "subscriptionId"));
        Assertions.assertNull(value(ID, TEMPLATE, null));
        Assertions.assertNull(value(ID, TEMPLATE, "missing"));
    }
}
