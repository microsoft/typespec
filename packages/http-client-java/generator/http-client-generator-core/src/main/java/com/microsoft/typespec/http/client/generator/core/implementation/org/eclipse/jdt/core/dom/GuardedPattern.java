// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2021, 2024 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

/**
 * GuardedPattern pattern AST node type.
 *
 * <pre>
 * GuardedPattern:
 *      Pattern when Expression
 * </pre>
 *
 * @since 3.27
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class GuardedPattern extends Pattern {

    GuardedPattern(AST ast) {
        super(ast);
        supportedOnlyIn21();
    }

    /**
     * The "pattern" structural property of this node type (child type: {@link Pattern}). (added in JEP 406).
     */
    public static final ChildPropertyDescriptor PATTERN_PROPERTY = internalPatternPropertyFactory();

    /**
     * The "expression" structural property of this node type (child type: {@link Expression}). (added in JEP 406).
     */
    public static final ChildPropertyDescriptor EXPRESSION_PROPERTY
        = new ChildPropertyDescriptor(GuardedPattern.class, "expression", Expression.class, true); //$NON-NLS-1$ );

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(GuardedPattern.class, propertyList);
        addProperty(PATTERN_PROPERTY, propertyList);
        addProperty(EXPRESSION_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The pattern; <code>null</code> for none
     */
    private volatile Pattern pattern;

    /**
     * The expression; <code>null</code> for none; lazily initialized (but does <b>not</b> default to none).
     */
    private volatile Expression conditionalExpression;

    @Override
    int getNodeType0() {
        return 107;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getPattern());
            acceptChild(visitor, getExpression());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the conditional expression of this pattern, or <code>null</code> if there is none (the "default:" case).
     *
     * @return the expression node, or <code>null</code> if there is none
     * @since 3.38
     */
    public Expression getExpression() {
        supportedOnlyIn21();
        if (this.conditionalExpression == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.conditionalExpression == null) {
                    this.conditionalExpression = postLazyInit(this.ast.newNullLiteral(), EXPRESSION_PROPERTY);
                }
            }
        }
        return this.conditionalExpression;
    }

    /**
     * Returns the pattern of this Guarded Pattern, or <code>empty</code> if there is none.
     *
     * @return the pattern node (element type: {@link Pattern})
     * @exception UnsupportedOperationException if this operation is used other than JLS18
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @noreference This method is not intended to be referenced by clients as it is a part of Java preview feature.
     */
    public Pattern getPattern() {
        supportedOnlyIn21();
        if (this.pattern == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.pattern == null) {
                    this.pattern = postLazyInit(this.ast.newNullPattern(), PATTERN_PROPERTY);
                }
            }
        }
        return this.pattern;
    }

    /**
     * Sets the conditional expression of this pattern, or clears it (turns it into the "default:" case).
     *
     * @param expression the expression node, or <code>null</code> to turn it into the "default:" case
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.38
     */
    public void setExpression(Expression expression) {
        supportedOnlyIn21();
        ASTNode oldChild = this.conditionalExpression;
        preReplaceChild(oldChild, expression, EXPRESSION_PROPERTY);
        this.conditionalExpression = expression;

    }

    /**
     * Sets the pattern of this switch case.
     *
     * @exception UnsupportedOperationException if this operation is used not for JLS18
     * @exception UnsupportedOperationException if this operation is used without previewEnabled
     * @since 3.38
     */
    public void setPattern(Pattern pattern) {
        supportedOnlyIn21();
        ASTNode oldChild = this.pattern;
        preReplaceChild(oldChild, pattern, PATTERN_PROPERTY);
        this.pattern = pattern;

    }

    /**
     * A character index into the original restricted identifier source string, or <code>-1</code> if no restricted
     * identifier source position information is available for this node; <code>-1</code> by default.
     *
     * @noreference since 3.30
     */
    protected void setRestrictedIdentifierStartPosition(int restrictedIdentifierStartPosition) {
        if (restrictedIdentifierStartPosition < 0) {
            throw new IllegalArgumentException();
        }
        // restrictedIdentifierStartPosition is not considered a structural property
        // but we protect it nevertheless
        checkModifiable();
    }
}
