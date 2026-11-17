// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;

/**
 * Internal AST visitor for propagating syntax errors.
 */
class ASTSyntaxErrorPropagator extends ASTVisitor {

    private final IProblem[] problems;

    ASTSyntaxErrorPropagator(IProblem[] problems) {
        // visit Javadoc.tags() as well
        super(true);
        this.problems = problems;
    }

    private boolean checkAndTagAsMalformed(ASTNode node) {
        boolean tagWithErrors = false;
        for (IProblem problem : this.problems) {
            switch (problem.getID()) {
                case 1610612946:
                case 1610612945:
                case 1610612940:
                case 1610612941:
                case 1610612966:
                case 1610612967:
                case 1610612968:
                case 1610612969:
                case 1610612970:
                case 1610612971:
                case 1610612972:
                case 1610612973:
                case 1610612974:
                case 1610612975:
                case 1610612976:
                case 1610612977:
                case 1610612978:
                case 1610612986:
                case 1610612987:
                case 1610612988:
                case 1610612989:
                case 1610612990:
                case 1610612991:
                case 1610612992:
                case 1610612993:
                case 1610612994:
                case 1610612995:
                case 1610612996:
                case 1610612998:
                    break;

                default:
                    continue;
            }
            int position = problem.getSourceStart();
            int start = node.getStartPosition();
            int end = start + node.getLength();
            if ((start <= position) && (position <= end)) {
                node.setFlags(node.getFlags() | 1);
                // clear the bits on parent
                ASTNode currentNode = node.getParent();
                while (currentNode != null) {
                    currentNode.setFlags(currentNode.getFlags() & ~1);
                    currentNode = currentNode.getParent();
                }
                tagWithErrors = true;
            }
        }
        return tagWithErrors;
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(ImportDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(CompilationUnit node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        return checkAndTagAsMalformed(node);
    }

    @Override
    public boolean visit(Initializer node) {
        return checkAndTagAsMalformed(node);
    }
}
