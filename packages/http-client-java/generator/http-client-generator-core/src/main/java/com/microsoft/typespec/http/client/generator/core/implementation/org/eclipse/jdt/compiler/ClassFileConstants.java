// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
 * <p>
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 * <p>
 * SPDX-License-Identifier: EPL-2.0
 * <p>
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Jesper S Moller - Contributions for
 *							Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *							Bug 406982 - [1.8][compiler] Generation of MethodParameters Attribute in classfile
 *							Bug 416885 - [1.8][compiler]IncompatibleClassChange error (edit)
 *							Bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *                          Bug 439889 - [1.8][compiler] [lambda] Deserializing lambda fails with IllegalArgumentException: "Invalid lambda deserialization"
 *******************************************************************************/

/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
 * <p>
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 * <p>
 * SPDX-License-Identifier: EPL-2.0
 * <p>
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Jesper S Moller - Contributions for
 *							Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *							Bug 406982 - [1.8][compiler] Generation of MethodParameters Attribute in classfile
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/**
 * This type is used to store all the constant pool entries.
 */
public abstract class ClassFileConstants {

    // predefined methods constant names
    public static final char[] Init = "<init>".toCharArray(); //$NON-NLS-1$

    // predefined type constant names
    public static final char[] This = "this".toCharArray(); //$NON-NLS-1$

}
