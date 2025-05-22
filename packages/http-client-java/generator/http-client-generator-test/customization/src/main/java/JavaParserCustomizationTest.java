// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import com.microsoft.typespec.http.client.generator.core.customization.ClassCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.PackageCustomization;
import org.slf4j.Logger;

public class JavaParserCustomizationTest extends Customization {
    @Override
    public void customize(LibraryCustomization customization, Logger logger) {
        logger.info("Customizing the NamingClient javadoc");
        PackageCustomization packageCustomization = customization.getPackage("tsptest.naming");
        ClassCustomization classCustomization = packageCustomization.getClass("NamingClient");
        classCustomization.getMethod("postWithResponse")
            .getJavadoc()
            .setDescription("Protocol method for POST operation.");
    }
}
