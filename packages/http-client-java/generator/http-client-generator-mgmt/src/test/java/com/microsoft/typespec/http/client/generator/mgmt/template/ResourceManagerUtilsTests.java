// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

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
        ResourceManagerUtilsTemplate.getInstance().write(file);
        Path source = compilationDirectory.resolve("ResourceManagerUtils.java");
        Files.writeString(source, file.getContents().toString());
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                compilationDirectory.toString(), source.toString());
        Assertions.assertEquals(0, result, diagnostics.toString(StandardCharsets.UTF_8));
        classLoader = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() },
            ResourceManagerUtilsTests.class.getClassLoader());
        parse = classLoader.loadClass("ResourceManagerUtils")
            .getDeclaredMethod("getValueFromIdByParameterName", String.class, String.class, String.class);
        parse.setAccessible(true);
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
