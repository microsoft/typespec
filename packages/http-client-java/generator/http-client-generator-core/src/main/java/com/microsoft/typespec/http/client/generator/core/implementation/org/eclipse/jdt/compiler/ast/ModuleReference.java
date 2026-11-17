// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;

public class ModuleReference extends ASTNode {

    public long[] sourcePositions; // each entry is using the code : (start<<32) + end
    public char[] moduleName;

    public ModuleReference(char[][] tokens, long[] sourcePositions) {

        this.sourcePositions = sourcePositions;
        this.sourceEnd = (int) (sourcePositions[sourcePositions.length - 1]);
        this.sourceStart = (int) (sourcePositions[0] >>> 32);
        this.moduleName = CharOperation.concatWith(tokens);
    }

}
