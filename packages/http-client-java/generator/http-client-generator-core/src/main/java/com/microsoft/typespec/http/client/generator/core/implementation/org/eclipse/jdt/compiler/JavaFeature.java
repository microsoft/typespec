// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2020, 2025 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/**
 * An internal enumeration of all Java language features that were introduced as standard feature or preview feature
 * from Java 15. The idea is to have one location where the applicability of a feature, such as version supported in,
 * whether or not a preview, what are the restricted keywords introduced by a feature etc. This is expected to be
 * updated every time there's a new Java version and the change is expected to be one of the following kinds: <ul>
 * <li>The preview feature continues to be a preview in the next version</li> <li>The preview feature is upgraded to a
 * standard feature</li> <li>The preview feature is removed</li> </ul>
 *
 * @author jay
 */
public enum JavaFeature {
    TEXT_BLOCKS(3866624L, "Text Blocks"),
    PATTERN_MATCHING_IN_INSTANCEOF(3932160L, "Type Patterns"),
    PATTERN_MATCHING_IN_SWITCH(4259840L, "Pattern Matching in Switch"),
    RECORD_PATTERNS(4259840L, "Record Pattern"),
    COMPACT_SOURCE_AND_INSTANCE_MAIN_METHODS(4521984L, "Compact Source Files and Instance Main Methods");

    final long compliance;
    final String name;

    public String getName() {
        return this.name;
    }

    public long getCompliance() {
        return this.compliance;
    }

    JavaFeature(long compliance, String name) {
        this.compliance = compliance;
        this.name = name;
    }
}
