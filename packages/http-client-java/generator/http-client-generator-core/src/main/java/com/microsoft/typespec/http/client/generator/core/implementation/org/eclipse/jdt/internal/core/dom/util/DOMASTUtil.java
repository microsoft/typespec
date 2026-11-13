// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2019, 2025 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.util;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.AST;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTNode;

@SuppressWarnings("deprecation")
public abstract class DOMASTUtil {

    /**
     * Validates if the given <code>AST</code> supports the provided <code>nodeType</code>. This API checks for node
     * types supported from JLS 14 onwards and will return <code>true</code> for nodes added before JLS14.
     *
     * @param ast the AST to be evaluated
     * @param nodeType the node type constant indicating a node of type to be evaluated
     * @return <code>true</code> if the given <code>AST</code> supports the provided <code>nodeType</code> else
     * <code>false</code>
     * @see ASTNode#getNodeType()
     * @since 3.22
     */
    private static boolean isNodeTypeSupportedinAST(AST ast, int nodeType) {
        return isNodeTypeSupportedinAST(ast.apiLevel(), nodeType);
    }

    /**
     * Validates if the given <code>apiLevel</code> and <code>previewEnabled</code> supports the provided
     * <code>nodeType</code>. This API checks for node types supported from JLS 14 onwards and will return
     * <code>true</code> for nodes added before JLS14.
     *
     * @param apiLevel the level to be checked
     * @param nodeType the node type constant indicating a node of type to be evaluated
     * @return <code>true</code> if the given <code>AST</code> supports the provided <code>nodeType</code> else
     * <code>false</code>
     * @see ASTNode#getNodeType()
     * @since 3.22
     */
    private static boolean isNodeTypeSupportedinAST(int apiLevel, int nodeType) {
        switch (nodeType) {
            case 100:
            case 101:
                return apiLevel >= 14;

            case 102:
                return apiLevel >= 15;

            case 103:
            case 104:
                return apiLevel >= 16;

            case 106:
                return apiLevel >= 20;

            case 110:
                return apiLevel >= 18;

            case 113:
                return apiLevel >= 21;

            case 114:
                return apiLevel >= 22;
        }
        return false;
    }

    /**
     * Validates if the given <code>apiLevel</code> and <code>previewEnabled</code> supports the provided
     * <code>nodeType</code>. This API checks for node types supported from JLS 14 onwards and will return
     * <code>true</code> for nodes added before JLS14.
     *
     * @param ast the AST to be evaluated
     * @return <code>true</code> if the given <code>AST</code> supports the provided <code>nodeType</code> else
     * <code>false</code>
     * @see ASTNode#getNodeType()
     * @since 3.22
     */
    public static boolean isFeatureSupportedinAST(AST ast) {

        switch (512) {
            case 512:
                return ast.apiLevel() >= 17;

            case 4096:
                return ast.apiLevel() >= 17;
        }
        return false;
    }

    public static boolean isRecordDeclarationSupported(AST ast) {
        return isNodeTypeSupportedinAST(ast, 103);
    }

    public static boolean isPatternInstanceofExpressionSupported(AST ast) {
        return isNodeTypeSupportedinAST(ast, 104);
    }

    public static boolean isPatternSupported(AST ast) {
        return isNodeTypeSupportedinAST(ast, 106);
    }

    public static boolean isEitherOrMultiPatternSupported(AST ast) {
        return isNodeTypeSupportedinAST(ast, 114);
    }

    public static boolean isJavaDocCodeSnippetSupported(int apiLevel) {
        return isNodeTypeSupportedinAST(apiLevel, 110);
    }

    public static void checkASTLevel() {

        if (!AST.ALL_VERSIONS.contains(23)) {
            throw new IllegalArgumentException(Integer.toString(23));
        }
    }
}
