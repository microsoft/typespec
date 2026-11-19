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
 *     Stephan Herrmann - Contributions for
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 358903 - Filter practically unimportant resource leak warnings
 *								bug 381445 - [compiler][resource] Can the resource leak check be made aware of Closeables.closeQuietly?
 *								bug 400421 - [compiler] Null analysis for fields does not take @com.google.inject.Inject into account
 *								bug 382069 - [null] Make the null analysis consider JUnit's assertNotNull similarly to assertions
 *								Bug 405569 - Resource leak check false positive when using DbUtils.closeQuietly
 *								Bug 427199 - [1.8][resource] avoid resource leak warnings on Streams that have no resource
 *								Bug 425183 - [1.8][inference] make CaptureBinding18 safe
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *								Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *    Jesper S Moller - Contributions for
 *								Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *								Bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *								bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *    Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                              Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *    Ulrich Grave <ulrich.grave@gmx.de> - Contributions for
 *                              bug 386692 - Missing "unused" warning on "autowired" fields
 *    Pierre-Yves B. <pyvesdev@gmail.com> - Contribution for
 *                              bug 542520 - [JUnit 5] Warning The method xxx from the type X is never used locally is shown when using MethodSource
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

// TODO should rename into TypeNames (once extracted last non name constants)
public interface TypeConstants {

    char[] WILDCARD_NAME = { '?' };
    char[] WILDCARD_SUPER = " super ".toCharArray(); //$NON-NLS-1$
    char[] WILDCARD_EXTENDS = " extends ".toCharArray(); //$NON-NLS-1$

    char[] BYTE = "byte".toCharArray(); //$NON-NLS-1$
    char[] SHORT = "short".toCharArray(); //$NON-NLS-1$
    char[] INT = "int".toCharArray(); //$NON-NLS-1$
    char[] LONG = "long".toCharArray(); //$NON-NLS-1$
    char[] FLOAT = "float".toCharArray(); //$NON-NLS-1$
    char[] DOUBLE = "double".toCharArray(); //$NON-NLS-1$
    char[] CHAR = "char".toCharArray(); //$NON-NLS-1$
    char[] BOOLEAN = "boolean".toCharArray(); //$NON-NLS-1$
    char[] VOID = "void".toCharArray(); //$NON-NLS-1$

    // Synthetics
    char[] INIT = "<init>".toCharArray(); //$NON-NLS-1$
    char[] CLINIT = "<clinit>".toCharArray(); //$NON-NLS-1$

    // synthetic package-info name
    char[] PACKAGE_INFO_NAME = "package-info".toCharArray(); //$NON-NLS-1$
    char[] MODULE_INFO_NAME = "module-info".toCharArray(); //$NON-NLS-1$
}
