// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Switch case AST node type. A switch case is a special kind of node used only in switch statements. It is a
 * <code>Statement</code> in name only.
 *
 * <pre>
 * SwitchCase:
 * 		<b>case</b> Expression  <b>:</b>
 * 		<b>default</b> <b>:</b>
 *
 * Switch case allows multiple expressions and '->' as part of Java 12 preview feature (JEP 325)
 *		<b>case</b> [ Expression { <b>,</b> Expression } ]  <b>{ : | ->}</b>
 *		<b>default</b> <b>{ : | ->}</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class SwitchCase extends Statement {

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}). (added in JEP 325).
     *
     * @since 3.18
     */
    public static final ChildListPropertyDescriptor EXPRESSIONS2_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * <code>true</code> indicates "->" and <code>false</code> indicates ":".
     */
    private boolean switchLabeledRule = false;

    /**
     * The expression list; <code>empty</code> for none;
     */
    private ASTNode.NodeList expressions = null;

    /**
     * Creates a new AST node for a switch case pseudo-statement owned by the given AST. By default, there is no
     * expression, but legal, and switchLabeledRule is false which indicates ":".
     *
     * @param ast the AST that is to own this node
     */
    SwitchCase(AST ast) {
        super(ast);
        this.expressions = new ASTNode.NodeList(EXPRESSIONS2_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 49;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.expressions);
        }

    }

    /**
     * Returns the list of expressions of this switch case, or <code>empty</code> if there is none (the "default:"
     * case).
     *
     * @return the list of expression nodes (element type: {@link Expression})
     * @since 3.22
     */
    public List expressions() {

        return this.expressions;
    }

    /**
     * Sets the switchLabeledRule of this switch case as <code>true</code> or <code>false</code>. <code>true</code>
     * indicates "->" and <code>false</code> indicates ":".
     *
     * @param switchLabeledRule <code>true</code> or <code>false</code>
     * @since 3.22
     */
    public void setSwitchLabeledRule(boolean switchLabeledRule) {

        preValueChange();
        this.switchLabeledRule = switchLabeledRule;

    }

    /**
     * Gets the switchLabeledRule of this switch case as <code>true</code> or <code>false</code>. <code>true</code>
     * indicates "->" and <code>false</code> indicates ":".
     *
     * @return switchLabeledRule <code>true</code> or <code>false</code>
     * @since 3.22
     */
    public boolean isSwitchLabeledRule() {

        return this.switchLabeledRule;
    }

    /**
     * Returns whether this switch case represents the "default:" case. <p> This convenience method is equivalent to
     * <code>getExpression() == null</code> or <code>expressions().isEmpty()</code>. </p>
     *
     * @return <code>true</code> if this is the default switch case, and <code>false</code> if this is a non-default
     * switch case
     */
    public boolean isDefault() {
        return expressions().isEmpty();
    }
}
