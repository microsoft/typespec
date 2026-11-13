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
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

/**
 * Abstract base class of AST nodes that represent statements. There are many kinds of statements. <p> The grammar
 * combines both Statement and BlockStatement.</p>
 *
 * <pre>
 * Statement:
 *    {@link AssertStatement},
 *    {@link Block},
 *    {@link BreakStatement},
 *    {@link ConstructorInvocation},
 *    {@link ContinueStatement},
 *    {@link DoStatement},
 *    {@link EmptyStatement},
 *    {@link EnhancedForStatement}
 *    {@link ExpressionStatement},
 *    {@link ForStatement},
 *    {@link IfStatement},
 *    {@link LabeledStatement},
 *    {@link ReturnStatement},
 *    {@link SuperConstructorInvocation},
 *    {@link SwitchCase},
 *    {@link SwitchStatement},
 *    {@link SynchronizedStatement},
 *    {@link ThrowStatement},
 *    {@link TryStatement},
 *    {@link TypeDeclarationStatement},
 *    {@link VariableDeclarationStatement},
 *    {@link WhileStatement}
 * </pre>
 *
 * @since 2.0
 */
public abstract class Statement extends ASTNode {

    /**
     * Creates a new AST node for a statement owned by the given AST. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Statement(AST ast) {
        super(ast);
    }
}
