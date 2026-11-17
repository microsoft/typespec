// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2006, 2023 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

/**
 * CombinedBinaryExpression is an implementation of BinaryExpression that specifically attempts to mitigate the issues
 * raised by expressions which have a very deep leftmost branch. It does so by maintaining a table of direct references
 * to its subexpressions, and implementing non-recursive variants of the most significant recursive algorithms of its
 * ancestors. The subexpressions table only holds intermediate binary expressions. Its role is to provide the reversed
 * navigation through the left relationship of BinaryExpression to Expression. To cope with potentially very deep left
 * branches, an instance of CombinedBinaryExpression is created once in a while, using variable thresholds held by
 * {@link #arityMax}. As a specific case, the topmost node of all binary expressions that are deeper than one is a
 * CombinedBinaryExpression, but it has no references table.<br> Notes: <ul> <li>CombinedBinaryExpression is not meant
 * to behave in other ways than BinaryExpression in any observable respect;</li> <li>visitors that implement their own
 * traversal upon binary expressions should consider taking advantage of combined binary expressions, or else face a
 * risk of StackOverflowError upon deep instances;</li> <li>callers that need to change the operator should rebuild the
 * expression from scratch, or else amend the references table as needed to cope with the resulting, separated
 * expressions.</li> </ul>
 */
public class CombinedBinaryExpression extends BinaryExpression {

    /**
     * The number of consecutive binary expressions of this' left branch that bear the same operator as this.<br> Notes:
     * <ul><li>the presence of a CombinedBinaryExpression instance resets arity, even when its operator is
     * compatible;</li> <li>this property is maintained by the parser.</li> </ul>
     */
    public int arity;

    /**
     * The threshold that will trigger the creation of the next full-fledged CombinedBinaryExpression. This field is
     * only maintained for the topmost binary expression (it is 0 otherwise). It enables a variable policy, which scales
     * better with very large expressions.
     */
    public int arityMax;

    /**
     * A table of references to the binary expressions of this' left branch. Instances of CombinedBinaryExpression are
     * not repeated here. Instead, the left subexpression of referencesTable[0] may be a combined binary expression, if
     * appropriate. Null when this only cares about tracking the expression's arity.
     */
    public BinaryExpression[] referencesTable;

    /**
     * Make a new CombinedBinaryExpression. If arity is strictly greater than one, a references table is built and
     * initialized with the reverse relationship of the one defined by {@link BinaryExpression#left}. arity and left
     * must be compatible with each other (that is, there must be at least arity - 1 consecutive compatible binary
     * expressions into the leftmost branch of left, the topmost of which being left's immediate left expression).
     *
     * @param left the left branch expression
     * @param right the right branch expression
     */
    public CombinedBinaryExpression(Expression left, Expression right) {
        super(left, right, 14);

        initArity(left, 1);
    }

    public CombinedBinaryExpression(CombinedBinaryExpression expression) {
        super(expression);
        initArity(expression.left, expression.arity);
    }

    private void initArity(Expression expression, int value) {
        this.arity = value;
        if (value > 1) {
            this.referencesTable = new BinaryExpression[value];
            this.referencesTable[value - 1] = (BinaryExpression) expression;
            for (int i = value - 1; i > 0; i--) {
                this.referencesTable[i - 1] = (BinaryExpression) this.referencesTable[i].left;
            }
        } else {
            this.arityMax = 20;
        }
    }

    /**
     * Change {@link #arityMax} if and as needed. The current policy is to double arityMax each time this method is
     * called, until it reaches <code>160</code>. Other policies may consider incrementing it less agressively.
     * Call only after an appropriate value has been assigned to {@link #left}.
     */
    // more sophisticate increment policies would leverage the leftmost expression
    // to hold an indication of the number of uses of a given arityMax in a row
    public void tuneArityMax() {
        if (this.arityMax < 160) {
            this.arityMax *= 2;
        }
    }
}
