// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.checker;

import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGenAccessor;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import org.junit.jupiter.api.BeforeAll;

public class JavaFormatterTests {

    private final String JAVA_CONTENT = "package com.azure.autorest.fluent.checker;\n" + "\n"
        + "import com.azure.autorest.extension.base.plugin.PluginLogger;\n"
        + "import com.azure.autorest.fluent.FluentGen;\n" + "import com.azure.core.util.CoreUtils;\n"
        + "import org.slf4j.Logger;\n" + "\n" + "import java.lang.reflect.Method;\n" + "import java.util.ArrayList;\n"
        + "import java.util.Collections;\n" + "import java.util.List;\n" + "import java.util.regex.Pattern;\n" + "\n"
        + "public class JavaFormatter {\n" + "    private final String content;\n" + "    private final String path;\n"
        + "\n" + "    public JavaFormatter(String content, String path) {\n" + "        this.content = content;\n"
        + "        this.path = path;\n"
        + "        String longString = \"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachineScaleSets/{virtualMachineScaleSetName}/virtualMachines/{virtualmachineIndex}/networkInterfaces/{networkInterfaceName}/ipconfigurations/{ipConfigurationName}/publicipaddresses/{publicIpAddressName}\";\n"
        + "    }\n" + "}\n";

    private static FluentGenAccessor fluentgenAccessor;

    @BeforeAll
    public static void ensurePlugin() {
        FluentGen fluentgen = new TestUtils.MockFluentGen();
        fluentgenAccessor = new FluentGenAccessor(fluentgen);
    }

//    @EnabledForJreRange(min = JRE.JAVA_11, max = JRE.JAVA_20)
//    @Test
//    public void testFormatter() {
//        JavaFormatter formatter = new JavaFormatter(JAVA_CONTENT, "mock");
//        String content = formatter.format();
//        String[] lines = content.split("\r?\n", -1);
//        Assertions.assertTrue(Arrays.stream(lines).noneMatch(s -> s.equals("import com.azure.autorest.extension.base.plugin.PluginLogger;")));
//    }
}
