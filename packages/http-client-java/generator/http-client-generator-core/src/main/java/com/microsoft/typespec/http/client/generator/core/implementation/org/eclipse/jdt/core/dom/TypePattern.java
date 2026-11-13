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
 * TypePattern pattern AST node type.
 *
 * <pre>
 * TypePattern:
 *      {@link VariableDeclaration}
 * </pre>
 *
 * @since 3.27
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class TypePattern extends Pattern {
    /**
     * The "patternVariable" structural property of this node type (child type: {@link SingleVariableDeclaration}).
     *
     * @deprecated In the JLS22 API, this property is replaced by {@link VariableDeclaration}.
     */
    public static final ChildPropertyDescriptor PATTERN_VARIABLE_PROPERTY
        = new ChildPropertyDescriptor(TypePattern.class, "patternVariable", SingleVariableDeclaration.class, true); //$NON-NLS-1$

    /**
     * The "patternVariable" structural property of this node type (child type: {@link VariableDeclaration}).
     *
     * @since 3.39
     */
    public static final ChildPropertyDescriptor PATTERN_VARIABLE_PROPERTY2
        = new ChildPropertyDescriptor(TypePattern.class, "patternVariable2", VariableDeclaration.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(TypePattern.class, properyList);
        addProperty(PATTERN_VARIABLE_PROPERTY, properyList);
        reapPropertyList(properyList);

        properyList = new ArrayList(3);
        createPropertyList(TypePattern.class, properyList);
        addProperty(PATTERN_VARIABLE_PROPERTY2, properyList);
        reapPropertyList(properyList);
    }

    @Override
    int getNodeType0() {
        return 106;
    }

    TypePattern(AST ast) {
        super(ast);
        supportedOnlyIn21();
    }

    /**
     * Creates a new AST node for a type pattern node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     * @param flag which indicates true for SingleVariableDeclaration | false for VariableDeclarationFragment
     */
    TypePattern(AST ast, boolean flag) {
        super(ast);
        supportedOnlyIn21();
        if (ast.apiLevel >= 22) {
            if (flag) {
                this.patternVariable2 = new SingleVariableDeclaration(ast);
            } else {
                this.patternVariable2 = new VariableDeclarationFragment(ast);
            }
        } else {
            this.patternVariable = new SingleVariableDeclaration(ast);
        }
    }

    /**
     * The pattern Variable list; <code>empty</code> for none;
     */
    private volatile SingleVariableDeclaration patternVariable;

    /**
     * The extended pattern variable Null in less than JLS22. Added in JLS22; defaults null
     */
    private volatile VariableDeclaration patternVariable2 = null;

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     */
    final void internalSetPatternVariable(SingleVariableDeclaration patternVariable1) {
        supportedOnlyIn20();
        if (patternVariable1 == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.patternVariable;
        preReplaceChild(oldChild, patternVariable1, PATTERN_VARIABLE_PROPERTY);
        this.patternVariable = patternVariable1;

    }

    /**
     * Sets the pattern variable. Supports JLS22 and higher versions
     *
     * @param patternVariable2 the right operand node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @exception UnsupportedOperationException if this operation is used other than JLS22
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @since 3.39
     */
    public void setPatternVariable(VariableDeclaration patternVariable2) {
        supportedOnlyIn20();
        if (patternVariable2 == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.patternVariable2;
        preReplaceChild(oldChild, patternVariable2, PATTERN_VARIABLE_PROPERTY2);
        this.patternVariable2 = patternVariable2;

    }

    /**
     * Returns the pattern variable of Types Pattern.
     *
     * @return the pattern variable
     * @exception UnsupportedOperationException if this operation is used other than JLS19
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false In the
     * JLS22 API, this method is replaced by <code>getPatternVariable2()</code>
     * @since 3.38
     */
    public SingleVariableDeclaration getPatternVariable() {
        supportedOnlyIn20();
        if (this.patternVariable == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.patternVariable == null) {

                    this.patternVariable
                        = postLazyInit(new SingleVariableDeclaration(this.ast), PATTERN_VARIABLE_PROPERTY);
                }
            }
        }
        return this.patternVariable;
    }

    /**
     * Returns the pattern variable of Types Pattern.
     *
     * @return the pattern variable
     * @exception UnsupportedOperationException if this operation is used other than JLS22
     * @exception UnsupportedOperationException if this expression is used with previewEnabled flag as false
     * @since 3.39
     */
    public VariableDeclaration getPatternVariable2() {
        supportedOnlyIn22();
        if (this.patternVariable2 == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.patternVariable2 == null) {

                    this.patternVariable2
                        = postLazyInit(new SingleVariableDeclaration(this.ast), PATTERN_VARIABLE_PROPERTY2);
                }
            }
        }
        return this.patternVariable2;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            if (this.ast.apiLevel < 22) {
                acceptChild(visitor, getPatternVariable());
            } else {
                acceptChild(visitor, getPatternVariable2());
            }
        }
        visitor.endVisit(this);
    }
}
