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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ModuleScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortType;

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
        this.moduleName = CharOperation.concatWith(tokens, '.');
        this.sourcePositions = positions;
        this.sourceEnd = (int) (positions[positions.length - 1] & 0x00000000FFFFFFFF);
        this.sourceStart = (int) (positions[0] >>> 32);
    }

    public boolean isOpen() {
        return (this.modifiers & 32) != 0;
    }

    public void traverse(ASTVisitor visitor) {
        java.util.Objects.requireNonNull(visitor);
    }

    public StringBuilder printHeader(StringBuilder output) {

        if (this.annotations != null) {
            for (int i = 0; i < this.annotations.length; i++) {
                this.annotations[i].print(0, output);
                if (i != this.annotations.length - 1)
                    output.append(" "); //$NON-NLS-1$
            }
            output.append('\n');
        }
        if (isOpen()) {
            output.append("open "); //$NON-NLS-1$
        }
        output.append("module "); //$NON-NLS-1$
        output.append(CharOperation.charToString(this.moduleName));
        return output;
    }

    public StringBuilder printBody(int indent, StringBuilder output) {
        output.append(" {"); //$NON-NLS-1$
        if (this.requires != null) {
            for (int i = 0; i < this.requiresCount; i++) {
                output.append('\n');
                printIndent(indent + 1, output);
                this.requires[i].print(0, output);
            }
        }
        if (this.exports != null) {
            for (int i = 0; i < this.exportsCount; i++) {
                output.append('\n');
                this.exports[i].print(indent + 1, output);
            }
        }
        if (this.opens != null) {
            for (int i = 0; i < this.opensCount; i++) {
                output.append('\n');
                this.opens[i].print(indent + 1, output);
            }
        }
        if (this.uses != null) {
            for (int i = 0; i < this.usesCount; i++) {
                output.append('\n');
                this.uses[i].print(indent + 1, output);
            }
        }
        if (this.servicesCount != 0) {
            for (int i = 0; i < this.servicesCount; i++) {
                output.append('\n');
                this.services[i].print(indent + 1, output);
            }
        }
        output.append('\n');
        return printIndent(indent, output).append('}');
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        //
        printIndent(indent, output);
        printHeader(output);
        return printBody(indent, output);
    }

    @Override
    public void abort(int abortLevel, IProblem problem) {
        switch (abortLevel) {
            case 2:
                throw new AbortCompilation(this.compilationResult, problem);

            case 4:
                throw new AbortCompilationUnit(this.compilationResult, problem);

            case 16:
                throw new AbortMethod(this.compilationResult, problem);

            default:
                throw new AbortType(this.compilationResult, problem);
        }
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    @Override
    public CompilationUnitDeclaration getCompilationUnitDeclaration() {
        return ((ModuleScope) null).referenceCompilationUnit();
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
