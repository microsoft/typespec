// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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

/*
 * Handler policy is responsible to answer the 3 following
 * questions:
 * 1. should the handler stop on first problem which appears
 *	to be a real error (that is, not a warning),
 * 2. should it proceed once it has gathered all problems
 * 3. Should problems be reported at all ?
 *
 * The intent is that one can supply its own policy to implement
 * some interactive error handling strategy where some UI would
 * display problems and ask user if he wants to proceed or not.
 */

public interface IErrorHandlingPolicy {
    boolean stopOnFirstError();

    boolean ignoreAllErrors();
}
