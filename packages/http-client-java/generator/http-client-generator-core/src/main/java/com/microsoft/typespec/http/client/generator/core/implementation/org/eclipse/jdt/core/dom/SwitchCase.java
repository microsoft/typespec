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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
     * The "expression" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     * @deprecated In the JLS 12 15.28.1 API, this property is replaced by {@link #EXPRESSIONS2_PROPERTY }.
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(SwitchCase.class, "expression", Expression.class, true); //$NON-NLS-1$

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}). (added in JEP 325).
     *
     * @since 3.18
     */
    public static final ChildListPropertyDescriptor EXPRESSIONS2_PROPERTY
        = new ChildListPropertyDescriptor(SwitchCase.class, "expression", Expression.class, true); //$NON-NLS-1$ );

    /**
     * The "switchLabeledRule" structural property of this node type (type: {@link Boolean}).
     *
     * @since 3.18
     */
    public static final SimplePropertyDescriptor SWITCH_LABELED_RULE_PROPERTY
        = new SimplePropertyDescriptor(SwitchCase.class, "switchLabeledRule", boolean.class); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(SwitchCase.class, propertyList);
        addProperty(EXPRESSION_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(2);
        createPropertyList(SwitchCase.class, propertyList);
        addProperty(EXPRESSIONS2_PROPERTY, propertyList);
        addProperty(SWITCH_LABELED_RULE_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The expression; <code>null</code> for none; lazily initialized (but does <b>not</b> default to none).
     *
     * @see #expressionInitialized
     */
    private volatile Expression optionalExpression;

    /**
     * <code>true</code> indicates "->" and <code>false</code> indicates ":".
     */
    private boolean switchLabeledRule = false;

    /**
     * The expression list; <code>empty</code> for none;
     */
    private ASTNode.NodeList expressions = null;

    /**
     * Indicates whether <code>optionalExpression</code> has been initialized.
     */
    private volatile boolean expressionInitialized;

    /**
     * Creates a new AST node for a switch case pseudo-statement owned by the given AST. By default, there is no
     * expression, but legal, and switchLabeledRule is false which indicates ":".
     *
     * @param ast the AST that is to own this node
     */
    SwitchCase(AST ast) {
        super(ast);
        if (ast.apiLevel >= 14) {
            this.expressions = new ASTNode.NodeList(EXPRESSIONS2_PROPERTY);
        }
    }

    @Override
    final int getNodeType0() {
        return 49;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            if (this.ast.apiLevel >= 14) {
                acceptChildren(visitor, this.expressions);
            } else {
                acceptChild(visitor, getExpression());
            }
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the expression of this switch case, or <code>null</code> if there is none (the "default:" case).
     *
     * @return the expression node, or <code>null</code> if there is none
     * @deprecated use expressions() (see JLS 12)
     */
    public Expression getExpression() {
        if (!this.expressionInitialized) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (!this.expressionInitialized) {
                    this.optionalExpression = postLazyInit(new SimpleName(this.ast), EXPRESSION_PROPERTY);
                    this.expressionInitialized = true;
                }
            }
        }
        return this.optionalExpression;
    }

    /**
     * Returns the list of expressions of this switch case, or <code>empty</code> if there is none (the "default:"
     * case).
     *
     * @return the list of expression nodes (element type: {@link Expression})
     * @exception UnsupportedOperationException if this operation is used below JLS14
     * @since 3.22
     */
    public List expressions() {
        if (this.expressions == null) {
            unsupportedBelow14();
        }
        return this.expressions;
    }

    /**
     * Sets the expression of this switch case, or clears it (turns it into the "default:" case).
     *
     * @param expression the expression node, or <code>null</code> to turn it into the "default:" case
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @deprecated see JLS 12
     */
    public void setExpression(Expression expression) {
        ASTNode oldChild = this.optionalExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.optionalExpression = expression;
        this.expressionInitialized = true;

    }

    /**
     * Sets the switchLabeledRule of this switch case as <code>true</code> or <code>false</code>. <code>true</code>
     * indicates "->" and <code>false</code> indicates ":".
     *
     * @param switchLabeledRule <code>true</code> or <code>false</code>
     * @exception UnsupportedOperationException if this operation is used below JLS14
     * @since 3.22
     */
    public void setSwitchLabeledRule(boolean switchLabeledRule) {
        unsupportedBelow14();
        preValueChange();
        this.switchLabeledRule = switchLabeledRule;

    }

    /**
     * Gets the switchLabeledRule of this switch case as <code>true</code> or <code>false</code>. <code>true</code>
     * indicates "->" and <code>false</code> indicates ":".
     *
     * @return switchLabeledRule <code>true</code> or <code>false</code>
     * @exception UnsupportedOperationException if this operation is used below JLS14
     * @since 3.22
     */
    public boolean isSwitchLabeledRule() {
        unsupportedBelow14();
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
        if (this.ast.apiLevel >= 14) {
            return expressions().isEmpty();
        }
        return getExpression() == null;
    }
}
