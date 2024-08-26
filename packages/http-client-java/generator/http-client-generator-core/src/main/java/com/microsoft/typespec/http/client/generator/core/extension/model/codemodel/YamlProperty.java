// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Customize a property mapping between a yaml property and a java property
 * It's currently a hint to let specific yaml constructor to decide whether serialize or deserialize
 * according to this annotation.
 *
 * @see AnnotatedPropertyUtils
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface YamlProperty {

    /**
     * The property name to read from yaml.
     * @return the property name to read from yaml
     */
    String value();
}
