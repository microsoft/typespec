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
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Opens directive AST node type (added in JLS9 API).
 *
 * <pre>
 * OpensDirective:
 *     <b>opens</b> PackageName [ <b>to</b>  ModuleName {<b>,</b> ModuleName } ] <b>;</b>
 * </pre>
 *
 * @since 3.14
 *
 * @noextend This class is not intended to be subclassed by clients.
 */
public class OpensDirective extends ModulePackageAccess {

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory();
    /**
     * The "modules" structural property of this node type (element type: {@link Name}).
     */
    public static final ChildListPropertyDescriptor MODULES_PROPERTY = internalModulesPropertyFactory();

    /**
     * Creates a new AST node for an opens directive owned by the given AST. The open directive initially is a regular
     * (non-targetted) single package open for an unspecified, but legal, Java package name. <p> N.B. This constructor
     * is package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    OpensDirective(AST ast) {
        super(ast);
    }

    @Override
    final ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalModulesProperty() {
        return MODULES_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 96;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        acceptVisitChildren(visitChildren, visitor);
    }
}
