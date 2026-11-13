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
 *     Stephan Herrmann  - Contribution for bug 295551
 *     Jesper S Moller   - Contributions for
 *							  Bug 405066 - [1.8][compiler][codegen] Implement code generation infrastructure for JSR335
 *     Frits Jalvingh    - contributions for bug 533830.
 *     Red Hat Inc.	     - add module-info Javadoc support
 *     Red Hat Inc.      - add NLS support for Text Blocks
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortType;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.HashSetOfInt;

@SuppressWarnings({ "rawtypes", "unchecked" })
public class CompilationUnitDeclaration extends ASTNode implements ReferenceContext {

    public ImportReference currentPackage;
    public ImportReference[] imports;
    public TypeDeclaration[] types;
    public ModuleDeclaration moduleDeclaration;
    public int[][] comments;

    public boolean ignoreFurtherInvestigation = false; // once pointless to investigate due to errors
    public boolean ignoreMethodBodies = false;

    public CompilationResult compilationResult;

    public Javadoc javadoc; // 1.5 addition for package-info.java

    private StringLiteral[] stringLiterals;
    private int stringLiteralsPtr;
    private HashSetOfInt stringLiteralsStart;

    public CompilationUnitDeclaration(CompilationResult compilationResult, int sourceLength) {

        this.compilationResult = compilationResult;
        // by definition of a compilation unit....
        this.sourceStart = 0;
        this.sourceEnd = sourceLength - 1;
    }

    /*
     * We cause the compilation task to abort to a given extent.
     */
    @Override
    public void abort(int abortLevel, IProblem problem) {
        switch (abortLevel) {
            case 8:
                throw new AbortType(this.compilationResult, problem);

            case 16:
                throw new AbortMethod(this.compilationResult, problem);

            default:
                throw new AbortCompilationUnit(this.compilationResult, problem);
        }
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    public void createPackageInfoType() {
        TypeDeclaration declaration = new TypeDeclaration(this.compilationResult);
        declaration.name = TypeConstants.PACKAGE_INFO_NAME;
        declaration.modifiers = 0 | 512;
        declaration.javadoc = this.javadoc;
        this.types[0] = declaration; // Assumes the first slot is meant for this type
    }

    @Override
    public CompilationUnitDeclaration getCompilationUnitDeclaration() {
        return this;
    }

    public char[] getMainTypeName() {
        if (this.compilationResult.compilationUnit == null) {
            char[] fileName = this.compilationResult.getFileName();

            int start = CharOperation.lastIndexOf('/', fileName) + 1;
            if (start == 0 || start < CharOperation.lastIndexOf('\\', fileName))
                start = CharOperation.lastIndexOf('\\', fileName) + 1;

            int end = CharOperation.lastIndexOf('.', fileName);
            if (end == -1)
                end = fileName.length;

            return CharOperation.subarray(fileName, start, end);
        } else {
            return this.compilationResult.compilationUnit.getMainTypeName();
        }
    }

    public boolean isPackageInfo() {
        return CharOperation.equals(getMainTypeName(), TypeConstants.PACKAGE_INFO_NAME);
    }

    public boolean isModuleInfo() {
        return CharOperation.equals(getMainTypeName(), TypeConstants.MODULE_INFO_NAME);
    }

    public boolean isSuppressed() {
        return false;
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        if (this.currentPackage != null) {
            printIndent(indent, output).append("package "); //$NON-NLS-1$
            this.currentPackage.print(output, false).append(";\n"); //$NON-NLS-1$
        }
        if (this.imports != null)
            for (ImportReference currentImport : this.imports) {
                printIndent(indent, output).append("import "); //$NON-NLS-1$
                if (currentImport.isStatic()) {
                    output.append("static "); //$NON-NLS-1$
                }
                currentImport.print(0, output).append(";\n"); //$NON-NLS-1$
            }
        if (this.moduleDeclaration != null) {
            this.moduleDeclaration.print(indent, output).append("\n"); //$NON-NLS-1$
        } else if (this.types != null) {
            for (TypeDeclaration t : this.types) {
                t.print(indent, output).append("\n"); //$NON-NLS-1$
            }
        }
        return output;
    }

    public void recordStringLiteral(StringLiteral literal, boolean fromRecovery) {
        if (this.stringLiteralsStart != null) {
            if (this.stringLiteralsStart.contains(literal.sourceStart))
                return;
            this.stringLiteralsStart.add(literal.sourceStart);
        } else if (fromRecovery) {
            this.stringLiteralsStart = new HashSetOfInt(this.stringLiteralsPtr + 10);
            for (int i = 0; i < this.stringLiteralsPtr; i++) {
                this.stringLiteralsStart.add(this.stringLiterals[i].sourceStart);
            }

            if (this.stringLiteralsStart.contains(literal.sourceStart))
                return;
            this.stringLiteralsStart.add(literal.sourceStart);
        }

        if (this.stringLiterals == null) {
            this.stringLiterals = new StringLiteral[10];
            this.stringLiteralsPtr = 0;
        } else {
            int stackLength = this.stringLiterals.length;
            if (this.stringLiteralsPtr == stackLength) {
                System.arraycopy(this.stringLiterals, 0, this.stringLiterals = new StringLiteral[stackLength + 10], 0,
                    stackLength);
            }
        }
        this.stringLiterals[this.stringLiteralsPtr++] = literal;
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

    public void traverse(ASTVisitor visitor) {
        if (this.ignoreFurtherInvestigation)
            return;
        try {
            {
                java.util.Objects.requireNonNull(visitor);
                if (this.types != null && isPackageInfo()) {
                    // resolve synthetic type declaration
                    final TypeDeclaration syntheticTypeDeclaration = this.types[0];
                    // resolve javadoc package if any
                    final MethodScope methodScope = syntheticTypeDeclaration.staticInitializerScope;
                    // Don't traverse in null scope and invite trouble a la bug 252555.
                    if (this.javadoc != null && false) {
                        this.javadoc.traverse(visitor, methodScope);
                    }
                    // Don't traverse in null scope and invite trouble a la bug 252555.
                    if (this.currentPackage != null && false) {
                        final Annotation[] annotations = this.currentPackage.annotations;
                        if (annotations != null) {
                            int annotationsLength = annotations.length;
                            for (int i = 0; i < annotationsLength; i++) {
                                annotations[i].traverse(visitor, methodScope);
                            }
                        }
                    }
                }
                if (this.currentPackage != null) {
                    this.currentPackage.traverse(visitor);
                }
                if (this.imports != null) {
                    int importLength = this.imports.length;
                    for (int i = 0; i < importLength; i++) {
                        this.imports[i].traverse(visitor);
                    }
                }
                if (this.types != null) {
                    int typesLength = this.types.length;
                    for (int i = 0; i < typesLength; i++) {
                        this.types[i].traverse(visitor);
                    }
                }
                if (this.isModuleInfo() && this.moduleDeclaration != null) {
                    this.moduleDeclaration.traverse(visitor);
                }
            }
            java.util.Objects.requireNonNull(visitor);
        } catch (AbortCompilationUnit e) {
            // ignore
        }
    }

}
