// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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

/**
 * Abstract base class of AST nodes that represent expressions. There are several kinds of expressions.
 *
 * <pre>
 * Expression:
 *    {@link Annotation},
 *    {@link ArrayAccess},
 *    {@link ArrayCreation},
 *    {@link ArrayInitializer},
 *    {@link Assignment},
 *    {@link BooleanLiteral},
 *    {@link CaseDefaultExpression},
 *    {@link CastExpression},
 *    {@link CharacterLiteral},
 *    {@link ClassInstanceCreation},
 *    {@link ConditionalExpression},
 *    {@link CreationReference},
 *    {@link ExpressionMethodReference},
 *    {@link FieldAccess},
 *    {@link InfixExpression},
 *    {@link InstanceofExpression},
 *    {@link LambdaExpression},
 *    {@link MethodInvocation},
 *    {@link MethodReference},
 *    {@link Name},
 *    {@link NullLiteral},
 *    {@link NumberLiteral},
 *    {@link NullPattern},
 *    {@link ParenthesizedExpression},
 *    {@link PostfixExpression},
 *    {@link PrefixExpression},
 *    {@link StringLiteral},
 *    {@link SuperFieldAccess},
 *    {@link SuperMethodInvocation},
 *    {@link SuperMethodReference},
 *    {@link SwitchExpression},
 *    {@link ThisExpression},
 *    {@link TypeLiteral},
 *    {@link TypeMethodReference},
 *    {@link VariableDeclarationExpression}
 * </pre>
 *
 * @since 2.0
 */
public abstract class Expression extends ASTNode {

    /**
     * Creates a new AST node for an expression owned by the given AST. <p> N.B. This constructor is package-private.
     * </p>
     *
     * @param ast the AST that is to own this node
     */
    Expression(AST ast) {
        super(ast);
    }
}
