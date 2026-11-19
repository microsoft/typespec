// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2015, 2025 IBM Corporation and others.
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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ReferenceContext;

public class ModuleDeclaration extends ASTNode implements ReferenceContext {

    public ExportsStatement[] exports;
    public RequiresStatement[] requires;
    public UsesStatement[] uses;
    public ProvidesStatement[] services;
    public OpensStatement[] opens;
    public Annotation[] annotations;
    public int exportsCount;
    public int requiresCount;
    public int usesCount;
    public int servicesCount;
    public int opensCount;

    public int declarationSourceStart;
    public int declarationSourceEnd;
    public int bodyStart;
    // doesn't include the trailing comment if any.
    public int modifiersSourceStart;

    public char[] moduleName;
    public long[] sourcePositions;
    public int modifiers = 0;
    boolean ignoreFurtherInvestigation;

    CompilationResult compilationResult;

    public ModuleDeclaration(CompilationResult compilationResult, char[][] tokens, long[] positions) {
        this.compilationResult = compilationResult;
        this.exportsCount = 0;
        this.requiresCount = 0;
        this.moduleName = CharOperation.concatWith(tokens);
        this.sourcePositions = positions;
        this.sourceEnd = (int) (positions[positions.length - 1]);
        this.sourceStart = (int) (positions[0] >>> 32);
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

}
