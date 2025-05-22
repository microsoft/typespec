// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.util.List;

/**
 * The package level customization for an AutoRest generated client library.
 */
public interface PackageCustomization {
    /**
     * Gets the class level customization for a Java class in the package.
     *
     * @param className the simple name of the class
     * @return the class level customization
     */
    ClassCustomization getClass(String className);

    /**
     * This method lists all the classes in this package.
     * 
     * @return A list of classes that are in this package.
     */
    List<ClassCustomization> listClasses();
}
