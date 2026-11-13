// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler;

public abstract class DefaultErrorHandlingPolicies {

    /*
     * Accumulate all problems, then proceed with them.
     */
    public static IErrorHandlingPolicy proceedWithAllProblems() {
        return new IErrorHandlingPolicy() {
            @Override
            public boolean stopOnFirstError() {
                return false;
            }

            @Override
            public boolean ignoreAllErrors() {
                return false;
            }

            @Override
            public String toString() {
                return "ProceedWithAllProblems"; //$NON-NLS-1$
            }
        };
    }

    /*
     * Accumulate all problems, then proceed with them, but never report them.
     */
    public static IErrorHandlingPolicy ignoreAllProblems() {
        return new IErrorHandlingPolicy() {
            @Override
            public boolean stopOnFirstError() {
                return false;
            }

            @Override
            public boolean ignoreAllErrors() {
                return true;
            }

            @Override
            public String toString() {
                return "IgnoreAllProblems"; //$NON-NLS-1$
            }
        };
    }
}
