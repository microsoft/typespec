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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortType;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;

public class CompilationUnitDeclaration extends ASTNode implements ReferenceContext {

    public ImportReference currentPackage;
    public ImportReference[] imports;
    public TypeDeclaration[] types;
    public ModuleDeclaration moduleDeclaration;
    public int[][] comments;

    public boolean ignoreFurtherInvestigation = false; // once pointless to investigate due to errors

    public CompilationResult compilationResult;

    public Javadoc javadoc; // 1.5 addition for package-info.java

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
                throw new AbortType(problem);

            case 16:
                throw new AbortMethod(problem);

            default:
                throw new AbortCompilationUnit(problem);
        }
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    public void createPackageInfoType() {
        TypeDeclaration declaration = new TypeDeclaration(this.compilationResult);
        declaration.name = TypeConstants.PACKAGE_INFO_NAME;
        declaration.modifiers = 512;
        declaration.javadoc = this.javadoc;
        this.types[0] = declaration; // Assumes the first slot is meant for this type
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

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

}
