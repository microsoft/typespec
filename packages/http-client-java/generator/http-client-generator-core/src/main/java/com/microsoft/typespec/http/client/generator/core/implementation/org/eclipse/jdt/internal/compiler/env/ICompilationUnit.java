// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env;

/**
 * This interface denotes a compilation unit, providing its name and content.
 *
 * <p> Note: This internal interface has been implemented illegally by the org.apache.jasper.glassfish bundle from
 * Orbit, see <a href="https://bugs.eclipse.org/bugs/show_bug.cgi?id=500211">bug 500211</a>. Avoid changing the API or
 * supply default methods to avoid breaking the Eclipse Help system. </p>
 */
public interface ICompilationUnit {
    /**
     * Answer the file name which defines the type.
     *
     * The path part (optional) must be separated from the actual file proper name by a separator suitable for the type
     * (java.io.File.separator for example), e.g. "c:\\source\\com\\p\\X.java" or "/com/p/Y.java".
     *
     * The path to the zip or jar file (optional) must be separated from the actual path part by a '|' character,
     * e.g. "c:\\lib\\some.jar|/com/p/X.class" or "/lib/some.zip|/com/q/Y.class".
     *
     * The proper file name includes the suffix extension (e.g.&nbsp;".java")
     * e.g.&nbsp;"c:/org/eclipse/jdt/internal/compiler/env/ICompilationUnit.java"
     *
     * Return null if no file defines the type.
     */
    char[] getFileName();

    /**
     * Answer the contents of the compilation unit.
     *
     * In normal use, the contents are requested twice. Once during the initial lite parsing step, then again for the
     * more detailed parsing step. Implementors must never return null - return an empty char[] instead,
     * CharOperation.NO_CHAR being the candidate of choice.
     */
    char[] getContents();

    /**
     * Answer the name of the top level public type. For example, {Hashtable}.
     */
    char[] getMainTypeName();

    /**
     * Answer if optional problems should be ignored for this compilation unit. Implementors should return
     * <code>false</code> if there is no preference.
     */
    default boolean ignoreOptionalProblems() {
        return false;
    }

}
