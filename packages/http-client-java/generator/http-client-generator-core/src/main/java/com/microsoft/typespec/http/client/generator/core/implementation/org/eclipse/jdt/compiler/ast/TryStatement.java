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
 *     							bug 332637 - Dead Code detection removing code that isn't dead
 *     							bug 358827 - [1.7] exception analysis for t-w-r spoils null analysis
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *     							bug 359334 - Analysis for resource leak warnings does not consider exceptions as method exit points
 *								bug 358903 - Filter practically unimportant resource leak warnings
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *								bug 401088 - [compiler][null] Wrong warning "Redundant null check" inside nested try statement
 *								bug 401092 - [compiler][null] Wrong warning "Redundant null check" in outer catch of nested try
 *								bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *								bug 384380 - False positive on a ?? Potential null pointer access ?? after a continue
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *								Bug 371614 - [compiler][resource] Wrong "resource leak" problem on return/throw inside while loop
 *								Bug 444964 - [1.7+][resource] False resource leak warning (try-with-resources for ByteArrayOutputStream - return inside for loop)
 *     Jesper Steen Moller - Contributions for
 *								bug 404146 - [1.7][compiler] nested try-catch-finally-blocks leads to unrunnable Java byte code
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class TryStatement extends Statement {

    public Statement[] resources = new Statement[0];
    public Block tryBlock;
    public Block[] catchBlocks;

    public Argument[] catchArguments;

    public Block finallyBlock;

}
