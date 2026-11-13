// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2021, 2023 IBM Corporation and others.
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
 * PatternInstanceof expression AST node type.
 *
 * <pre>
 * PatternInstanceofExpression:
 *    Expression <b>instanceof</b> Variable
 * PatternInstanceofExpression:
 *    Expression <b>instanceof</b> Pattern
 * </pre>
 *
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class PatternInstanceofExpression extends Expression {

    /**
     * The "leftOperand" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor LEFT_OPERAND_PROPERTY
        = new ChildPropertyDescriptor(PatternInstanceofExpression.class, "leftOperand", Expression.class, true); //$NON-NLS-1$

    /**
     * The "rightOperand" structural property of this node type (child type: {@link SingleVariableDeclaration}).
     *
     * @deprecated use pattern property instead from Java 20 onwards
     */
    public static final ChildPropertyDescriptor RIGHT_OPERAND_PROPERTY = new ChildPropertyDescriptor(
        PatternInstanceofExpression.class, "rightOperand", SingleVariableDeclaration.class, true); //$NON-NLS-1$
    /**
     * The "pattern" structural property of this node type (child type: {@link Pattern}).
     *
     * @since 3.34
     */
    public static final ChildPropertyDescriptor PATTERN_PROPERTY
        = new ChildPropertyDescriptor(PatternInstanceofExpression.class, "pattern", Pattern.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(PatternInstanceofExpression.class, properyList);
        addProperty(LEFT_OPERAND_PROPERTY, properyList);
        addProperty(RIGHT_OPERAND_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(3);
        createPropertyList(PatternInstanceofExpression.class, properyList);
        addProperty(LEFT_OPERAND_PROPERTY, properyList);
        addProperty(PATTERN_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The left operand; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private volatile Expression leftOperand;

    /**
     * The right operand; lazily initialized; defaults to an unspecified, but legal, simple variable decalaration.
     */
    private volatile SingleVariableDeclaration rightOperand;
    /**
     * The right operand - a pattern, which could either be a TypePattern or a RecordPattern.
     */
    private volatile Pattern pattern;

    /**
     * Creates a new AST node for an instanceof expression owned by the given AST. By default, the node has unspecified
     * (but legal) operator, left and right operands.
     *
     * @param ast the AST that is to own this node
     */
    PatternInstanceofExpression(AST ast) {
        super(ast);
        unsupportedBelow16();
    }

    @Override
    final int getNodeType0() {
        return 104;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getLeftOperand());
            if (this.ast.apiLevel >= 21) {
                acceptChild(visitor, getPattern());
            } else {
                acceptChild(visitor, getRightOperand());
            }
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the left operand of this Patterninstanceof expression.
     *
     * @return the left operand node
     * @since 3.27
     */
    public Expression getLeftOperand() {
        if (this.leftOperand == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.leftOperand == null) {
                    this.leftOperand = postLazyInit(new SimpleName(this.ast), LEFT_OPERAND_PROPERTY);
                }
            }
        }
        return this.leftOperand;
    }

    /**
     * Sets the left operand of this instanceof expression.
     *
     * @param expression the left operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.27
     */
    public void setLeftOperand(Expression expression) {
        if (expression == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.leftOperand;
        preReplaceChild(oldChild, expression, LEFT_OPERAND_PROPERTY);
        this.leftOperand = expression;

    }

    /**
     * Returns the right operand of this instanceof expression.
     *
     * @return the right operand node
     * @since 3.27
     * @deprecated
     */
    public SingleVariableDeclaration getRightOperand() {
        if (this.rightOperand == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.rightOperand == null) {
                    this.rightOperand = postLazyInit(new SingleVariableDeclaration(this.ast), RIGHT_OPERAND_PROPERTY);
                }
            }
        }
        return this.rightOperand;
    }

    /**
     * Returns the pattern of this instanceof expression.
     *
     * @return the pattern
     * @since 3.34
     */
    public Pattern getPattern() {
        supportedOnlyIn21();
        if (this.pattern == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.pattern == null) {
                    this.pattern = postLazyInit(new TypePattern(this.ast), PATTERN_PROPERTY);
                }
            }
        }
        return this.pattern;
    }

    /**
     * Sets the right operand of this instanceof expression.
     *
     * @param referenceDeclaration the right operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.27
     * @deprecated
     */
    public void setRightOperand(SingleVariableDeclaration referenceDeclaration) {
        if (referenceDeclaration == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.rightOperand;
        preReplaceChild(oldChild, referenceDeclaration, RIGHT_OPERAND_PROPERTY);
        this.rightOperand = referenceDeclaration;

    }

    /**
     * Sets the right operand of this instanceof expression.
     *
     * @param pattern either the type or record pattern
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @since 3.34
     */
    public void setPattern(Pattern pattern) {
        supportedOnlyIn20();
        if (pattern == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.pattern;
        preReplaceChild(oldChild, pattern, PATTERN_PROPERTY);
        this.pattern = pattern;

    }
}
