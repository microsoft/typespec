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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Messages;

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

    SWITCH_EXPRESSIONS(3801088L, Messages.bind("Switch Expressions"), new char[][] { TypeConstants.YIELD }, false),

    TEXT_BLOCKS(3866624L, Messages.bind("Text Blocks"), new char[][] { }, false),

    PATTERN_MATCHING_IN_INSTANCEOF(3932160L, Messages.bind("Type Patterns"), new char[][] { }, false),

    RECORDS(3932160L, Messages.bind("Records"), new char[][] { TypeConstants.RECORD_RESTRICTED_IDENTIFIER }, false),

    SEALED_CLASSES(3997696L, Messages.bind("Sealed Types"),
        new char[][] { TypeConstants.SEALED, TypeConstants.NON_SEALED, TypeConstants.PERMITS }, false),
    PATTERN_MATCHING_IN_SWITCH(4259840L, Messages.bind("Pattern Matching in Switch"), new char[][] { }, false),
    RECORD_PATTERNS(4259840L, Messages.bind("Record Pattern"), new char[][] { }, false),
    UNNAMMED_PATTERNS_AND_VARS(4325376L, Messages.bind("Unnamed Patterns and Variables"), new char[][] { }, false),
    COMPACT_SOURCE_AND_INSTANCE_MAIN_METHODS(4521984L, Messages.bind("Compact Source Files and Instance Main Methods"),
        new char[][] { }, false),
    /**
     * JEP 513. As this feature graduated to a standard feature, we optimistically perform analysis using the rules of
     * this JEP even below 25. This is done so we can report when certain code will become legal when adopting version
     * 25.
     */
    FLEXIBLE_CONSTRUCTOR_BODIES(4521984L, Messages.bind("Flexible Constructor Bodies"), new char[][] { }, false),
    PRIMITIVES_IN_PATTERNS(4587520L, Messages.bind("Primitives In Patterns"), new char[][] { }, true),
    MODULE_IMPORTS(4521984L, Messages.bind("Module Import Declarations"), CharOperation.NO_CHAR_CHAR, false),
    MARKDOWN_COMMENTS(4390912L, Messages.bind("Markdown Documentation Comments"), CharOperation.NO_CHAR_CHAR, false),;

    final long compliance;
    final String name;
    final boolean isPreview;
    char[][] restrictedKeywords;

    public boolean isPreview() {
        return this.isPreview;
    }

    public String getName() {
        return this.name;
    }

    public long getCompliance() {
        return this.compliance;
    }

    public char[][] getRestrictedKeywords() {
        return this.restrictedKeywords;
    }

    public boolean isSupported(CompilerOptions options) {
        if (this.isPreview)
            return options.enablePreviewFeatures;
        return this.getCompliance() <= options.sourceLevel;
    }

    public boolean isSupported(long comp, boolean preview) {
        if (this.isPreview)
            return preview;
        return this.getCompliance() <= comp;
    }

    JavaFeature(long compliance, String name, char[][] restrictedKeywords, boolean isPreview) {
        this.compliance = compliance;
        this.name = name;
        this.isPreview = isPreview;
        this.restrictedKeywords = restrictedKeywords;
    }
}
