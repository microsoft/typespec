// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *     Jesper S Moller - Contributions for
 *							Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *							Bug 406982 - [1.8][compiler] Generation of MethodParameters Attribute in classfile
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 405104 - [1.8][compiler][codegen] Implement support for serializeable lambdas
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.classfmt;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;

/**
 * This type is used to store all the constant pool entries.
 */
public abstract class ClassFileConstants {

    /**
     * As we move away from declaring every compliance level explicitly (such as JDK11, JDK12 etc.), this method can be
     * used to compute the compliance level on the fly for a given Java major version.
     *
     * @param major Java major version
     * @return the compliance level for the given Java version
     */
    public static long getComplianceLevelForJavaVersion(int major) {
        switch (major) {
            case 45:
                return ((long) 45 << 16) + 3;

            default:
                major = Math.min(major, 70);
                return ((long) major << 16) + 0;
        }
    }

    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // predefined methods constant names
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    public static final char[] Init = "<init>".toCharArray(); //$NON-NLS-1$

    // $NON-NLS-1$
    static {
        {
            char[][] _typespecDiscarded_JAVA_LANG_REFLECT_ACCESSIBLEOBJECT = new char[][] {
                TypeConstants.JAVA,
                TypeConstants.LANG,
                TypeConstants.REFLECT,
                "AccessibleObject".toCharArray() };
        }
    }
    // $NON-NLS-1$
    static {
        {
            char[][] _typespecDiscarded_JAVA_LANG_REFLECT_ARRAY
                = new char[][] { TypeConstants.JAVA, TypeConstants.LANG, TypeConstants.REFLECT, "Array".toCharArray() };
        }
    }
    // $NON-NLS-1$
    // predefined type constant names
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    // $NON-NLS-1$
    public static final char[] This = "this".toCharArray(); //$NON-NLS-1$

}
