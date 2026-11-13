// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2006, 2020 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.RecoveryScanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.RecoveryScannerData;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.HashtableOfObjectToTokenArray;
import java.util.ArrayList;
import java.util.List;

/**
 * Internal AST visitor for propagating syntax errors.
 */
@SuppressWarnings({ "rawtypes" })
class ASTRecoveryPropagator extends DefaultASTVisitor {

    HashtableOfObjectToTokenArray endingTokens = new HashtableOfObjectToTokenArray();
    {
        this.endingTokens.put(AnonymousClassDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(ArrayAccess.class, new TerminalToken[] { TerminalToken.TokenNameRBRACKET });
        this.endingTokens.put(ArrayCreation.class,
            new TerminalToken[] { TerminalToken.TokenNameInvalid, TerminalToken.TokenNameRBRACKET });
        this.endingTokens.put(ArrayInitializer.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(ArrayType.class, new TerminalToken[] { TerminalToken.TokenNameRBRACKET });
        this.endingTokens.put(AssertStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(Block.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(BooleanLiteral.class,
            new TerminalToken[] { TerminalToken.TokenNamefalse, TerminalToken.TokenNametrue });
        this.endingTokens.put(BreakStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(CharacterLiteral.class, new TerminalToken[] { TerminalToken.TokenNameCharacterLiteral });
        this.endingTokens.put(ClassInstanceCreation.class,
            new TerminalToken[] { TerminalToken.TokenNameRBRACE, TerminalToken.TokenNameRPAREN });
        this.endingTokens.put(ConstructorInvocation.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(ContinueStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(DoStatement.class, new TerminalToken[] { TerminalToken.TokenNameRPAREN });
        this.endingTokens.put(EmptyStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(ExpressionStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(FieldDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(ImportDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(Initializer.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(MethodDeclaration.class,
            new TerminalToken[] { TerminalToken.TokenNameInvalid, TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(MethodInvocation.class, new TerminalToken[] { TerminalToken.TokenNameRPAREN });
        this.endingTokens.put(ModuleDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(ModuleDirective.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(NullLiteral.class, new TerminalToken[] { TerminalToken.TokenNamenull });
        this.endingTokens.put(NumberLiteral.class,
            new TerminalToken[] {
                TerminalToken.TokenNameIntegerLiteral,
                TerminalToken.TokenNameLongLiteral,
                TerminalToken.TokenNameFloatingPointLiteral,
                TerminalToken.TokenNameDoubleLiteral });
        this.endingTokens.put(PackageDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(ParenthesizedExpression.class, new TerminalToken[] { TerminalToken.TokenNameRPAREN });
        this.endingTokens.put(PostfixExpression.class,
            new TerminalToken[] { TerminalToken.TokenNamePLUS_PLUS, TerminalToken.TokenNameMINUS_MINUS });
        this.endingTokens.put(PrimitiveType.class,
            new TerminalToken[] {
                TerminalToken.TokenNamebyte,
                TerminalToken.TokenNameshort,
                TerminalToken.TokenNamechar,
                TerminalToken.TokenNameint,
                TerminalToken.TokenNamelong,
                TerminalToken.TokenNamefloat,
                TerminalToken.TokenNameboolean,
                TerminalToken.TokenNamedouble,
                TerminalToken.TokenNamevoid });
        this.endingTokens.put(ReturnStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(SimpleName.class, new TerminalToken[] { TerminalToken.TokenNameIdentifier });
        this.endingTokens.put(SingleVariableDeclaration.class,
            new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(StringLiteral.class, new TerminalToken[] { TerminalToken.TokenNameStringLiteral });
        this.endingTokens.put(SuperConstructorInvocation.class,
            new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(SuperMethodInvocation.class, new TerminalToken[] { TerminalToken.TokenNameRPAREN });
        this.endingTokens.put(SwitchCase.class, new TerminalToken[] { TerminalToken.TokenNameCOLON });
        this.endingTokens.put(SwitchStatement.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(SynchronizedStatement.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(ThisExpression.class, new TerminalToken[] { TerminalToken.TokenNamethis });
        this.endingTokens.put(ThrowStatement.class, new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
        this.endingTokens.put(TypeDeclaration.class, new TerminalToken[] { TerminalToken.TokenNameRBRACE });
        this.endingTokens.put(TypeLiteral.class, new TerminalToken[] { TerminalToken.TokenNameclass });
        this.endingTokens.put(VariableDeclarationStatement.class,
            new TerminalToken[] { TerminalToken.TokenNameSEMICOLON });
    }

    private final IProblem[] problems;
    private final boolean[] usedOrIrrelevantProblems;

    private final RecoveryScannerData data;
    private int blockDepth = 0;
    private int lastEnd;

    private TerminalToken[] insertedTokensKind;
    private int[] insertedTokensPosition;
    private boolean[] insertedTokensFlagged;

    private boolean[] removedTokensFlagged;
    private boolean[] replacedTokensFlagged;

    private ArrayList<ASTNode> stack = new ArrayList<>();

    ASTRecoveryPropagator(IProblem[] problems, RecoveryScannerData data) {
        // visit Javadoc.tags() as well
        this.problems = problems;
        this.usedOrIrrelevantProblems = new boolean[problems.length];

        this.data = data;

        if (this.data != null) {
            int length = 0;
            for (int i = 0; i < data.insertedTokensPtr + 1; i++) {
                length += data.insertedTokens[i].length;
            }
            this.insertedTokensKind = new TerminalToken[length];
            this.insertedTokensPosition = new int[length];
            this.insertedTokensFlagged = new boolean[length];
            int tokenCount = 0;
            for (int i = 0; i < data.insertedTokensPtr + 1; i++) {
                for (int j = 0; j < data.insertedTokens[i].length; j++) {
                    this.insertedTokensKind[tokenCount] = data.insertedTokens[i][j];
                    this.insertedTokensPosition[tokenCount] = data.insertedTokensPosition[i];
                    tokenCount++;
                }
            }

            if (data.removedTokensPtr != -1) {
                this.removedTokensFlagged = new boolean[data.removedTokensPtr + 1];
            }
            if (data.replacedTokensPtr != -1) {
                this.replacedTokensFlagged = new boolean[data.replacedTokensPtr + 1];
            }
        }
    }

    @Override
    public void endVisit(Block node) {
        this.blockDepth--;
        if (this.blockDepth <= 0) {
            flagNodeWithInsertedTokens();
        }
        super.endVisit(node);
    }

    @Override
    public boolean visit(Block node) {
        boolean visitChildren = super.visit(node);
        this.blockDepth++;
        return visitChildren;
    }

    @Override
    protected boolean visitNode(ASTNode node) {
        if (this.blockDepth > 0) {
            int start = node.getStartPosition();
            int end = start + node.getLength() - 1;

            // continue to visit the node only if it contains tokens modifications

            if (this.insertedTokensFlagged != null) {
                for (int i = 0; i < this.insertedTokensFlagged.length; i++) {
                    if (this.insertedTokensPosition[i] >= start && this.insertedTokensPosition[i] <= end) {
                        return true;
                    }
                }
            }

            if (this.removedTokensFlagged != null) {
                for (int i = 0; i <= this.data.removedTokensPtr; i++) {
                    if (this.data.removedTokensStart[i] >= start && this.data.removedTokensEnd[i] <= end) {
                        return true;
                    }
                }
            }

            if (this.replacedTokensFlagged != null) {
                for (int i = 0; i <= this.data.replacedTokensPtr; i++) {
                    if (this.data.replacedTokensStart[i] >= start && this.data.replacedTokensEnd[i] <= end) {
                        return true;
                    }
                }
            }

            return false;
        }
        return true;
    }

    @Override
    protected void endVisitNode(ASTNode node) {
        int start = node.getStartPosition();
        int end = start + node.getLength() - 1;

        // is inside diet part of the ast
        if (this.blockDepth < 1) {
            switch (node.getNodeType()) {
                case 81:
                case 15:
                case 71:
                case 23:
                case 26:
                case 28:
                case 31:
                case 93:
                case 35:
                case 55:
                case 78:
                case 77:
                case 79:
                case 8:
                    if (markIncludedProblems(start, end)) {
                        node.setFlags(node.getFlags() | 8);
                    }
                    break;
            }
        } else {
            markIncludedProblems(start, end);

            if (this.insertedTokensFlagged != null) {
                if (this.lastEnd != end) {
                    flagNodeWithInsertedTokens();
                }
                this.stack.add(node);
            }

            if (this.removedTokensFlagged != null) {
                for (int i = 0; i <= this.data.removedTokensPtr; i++) {
                    if (!this.removedTokensFlagged[i]
                        && this.data.removedTokensStart[i] >= start
                        && this.data.removedTokensEnd[i] <= end) {
                        node.setFlags(node.getFlags() | 8);
                        this.removedTokensFlagged[i] = true;
                    }
                }
            }

            if (this.replacedTokensFlagged != null) {
                for (int i = 0; i <= this.data.replacedTokensPtr; i++) {
                    if (!this.replacedTokensFlagged[i]
                        && this.data.replacedTokensStart[i] >= start
                        && this.data.replacedTokensEnd[i] <= end) {
                        node.setFlags(node.getFlags() | 8);
                        this.replacedTokensFlagged[i] = true;
                    }
                }
            }
        }
        this.lastEnd = end;
    }

    private void flagNodeWithInsertedTokens() {
        if (this.insertedTokensKind != null && this.insertedTokensKind.length > 0) {
            int s = this.stack.size();
            for (int i = s - 1; i > -1; i--) {
                flagNodesWithInsertedTokensAtEnd(this.stack.get(i));
            }
            for (int i = 0; i < s; i++) {
                flagNodesWithInsertedTokensInside(this.stack.get(i));
            }
            this.stack = new ArrayList<>();
        }
    }

    private void flagNodesWithInsertedTokensAtEnd(ASTNode node) {
        TerminalToken[] expectedEndingToken = this.endingTokens.get(node.getClass());
        if (expectedEndingToken != null) {
            int start = node.getStartPosition();
            int end = start + node.getLength() - 1;

            boolean flagParent = false;
            done: for (int i = this.insertedTokensKind.length - 1; i > -1; i--) {
                if (!this.insertedTokensFlagged[i] && this.insertedTokensPosition[i] == end) {
                    this.insertedTokensFlagged[i] = true;
                    for (TerminalToken terminalToken : expectedEndingToken) {
                        if (terminalToken == this.insertedTokensKind[i]) {
                            node.setFlags(node.getFlags() | 8);
                            break done;
                        }
                    }
                    flagParent = true;
                }
            }

            if (flagParent) {
                ASTNode parent = node.getParent();
                while (parent != null) {
                    parent.setFlags(node.getFlags() | 8);
                    if ((parent.getStartPosition() + parent.getLength() - 1) != end) {
                        parent = null;
                    } else {
                        parent = parent.getParent();
                    }
                }
            }
        }
    }

    private void flagNodesWithInsertedTokensInside(ASTNode node) {
        int start = node.getStartPosition();
        int end = start + node.getLength() - 1;
        for (int i = 0; i < this.insertedTokensKind.length; i++) {
            if (!this.insertedTokensFlagged[i]
                && start <= this.insertedTokensPosition[i]
                && this.insertedTokensPosition[i] < end) {
                node.setFlags(node.getFlags() | 8);
                this.insertedTokensFlagged[i] = true;
            }
        }
    }

    private boolean markIncludedProblems(int start, int end) {
        boolean foundProblems = false;
        for (int i = 0, max = this.problems.length; i < max; i++) {
            IProblem problem = this.problems[i];

            if (this.usedOrIrrelevantProblems[i])
                continue;

            switch (problem.getID()) {
                case 1610612946:
                case 1610612945:
                case 1610612940:
                case 1610612941:
                case 1610612966:
                case 1610612967:
                case 1610612968:
                case 1610612969:
                case 1610612970:
                case 1610612971:
                case 1610612972:
                case 1610612973:
                case 1610612974:
                case 1610612975:
                case 1610612976:
                case 1610612977:
                case 1610612978:
                case 1610612986:
                case 1610612987:
                case 1610612988:
                case 1610612989:
                case 1610612990:
                case 1610612991:
                case 1610612992:
                case 1610612993:
                case 1610612994:
                case 1610612995:
                case 1610612996:
                case 1610612998:
                    break;

                default:
                    this.usedOrIrrelevantProblems[i] = true;
                    continue;

            }

            int problemStart = problem.getSourceStart();
            int problemEnd = problem.getSourceEnd();
            if ((start <= problemStart) && (problemStart <= end) || (start <= problemEnd) && (problemEnd <= end)) {
                this.usedOrIrrelevantProblems[i] = true;
                foundProblems = true;
            }
        }
        return foundProblems;
    }

    @Override
    public void endVisit(ExpressionStatement node) {
        endVisitNode(node);
        if ((node.getFlags() & 8) == 0)
            return;
        Expression expression = node.getExpression();
        if (expression.getNodeType() == 7) {
            Assignment assignment = (Assignment) expression;
            Expression rightHandSide = assignment.getRightHandSide();
            if (rightHandSide.getNodeType() == 42) {
                SimpleName simpleName = (SimpleName) rightHandSide;
                if (CharOperation.equals(RecoveryScanner.FAKE_IDENTIFIER, simpleName.getIdentifier().toCharArray())) {
                    Expression expression2 = assignment.getLeftHandSide();
                    // unparent the expression to add it in the expression stateemnt
                    expression2.setParent(null, null);
                    expression2.setFlags(expression2.getFlags() | 8);
                    node.setExpression(expression2);
                }
            }
        }
    }

    @Override
    public void endVisit(ForStatement node) {
        endVisitNode(node);
        List initializers = node.initializers();
        if (initializers.size() == 1) {
            Expression expression = (Expression) initializers.get(0);
            if (expression.getNodeType() == 58) {
                VariableDeclarationExpression variableDeclarationExpression
                    = (VariableDeclarationExpression) expression;
                List fragments = variableDeclarationExpression.fragments();
                for (int i = 0, max = fragments.size(); i < max; i++) {
                    VariableDeclarationFragment fragment = (VariableDeclarationFragment) fragments.get(i);
                    SimpleName simpleName = fragment.getName();
                    if (CharOperation.equals(RecoveryScanner.FAKE_IDENTIFIER,
                        simpleName.getIdentifier().toCharArray())) {
                        fragments.remove(fragment);
                        variableDeclarationExpression.setFlags(variableDeclarationExpression.getFlags() | 8);
                    }
                }
            }
        }
    }

    @Override
    public void endVisit(VariableDeclarationStatement node) {
        endVisitNode(node);
        List fragments = node.fragments();
        for (Object f : fragments) {
            VariableDeclarationFragment fragment = (VariableDeclarationFragment) f;
            Expression expression = fragment.getInitializer();
            if (expression == null)
                continue;
            if ((expression.getFlags() & 8) == 0)
                continue;
            if (expression.getNodeType() == 42) {
                SimpleName simpleName = (SimpleName) expression;
                if (CharOperation.equals(RecoveryScanner.FAKE_IDENTIFIER, simpleName.getIdentifier().toCharArray())) {
                    fragment.setInitializer(null);
                    fragment.setFlags(fragment.getFlags() | 8);
                }
            }
        }
    }

    @Override
    public void endVisit(NormalAnnotation node) {
        endVisitNode(node);
        // is inside diet part of the ast
        if (this.blockDepth < 1) {
            List values = node.values();
            int size = values.size();
            if (size > 0) {
                MemberValuePair lastMemberValuePair = (MemberValuePair) values.get(size - 1);

                int annotationEnd = node.getStartPosition() + node.getLength();
                int lastMemberValuePairEnd = lastMemberValuePair.getStartPosition() + lastMemberValuePair.getLength();
                if (annotationEnd == lastMemberValuePairEnd) {
                    node.setFlags(node.getFlags() | 8);
                }
            }
        }
    }

    @Override
    public void endVisit(SingleMemberAnnotation node) {
        endVisitNode(node);
        // is inside diet part of the ast
        if (this.blockDepth < 1) {
            Expression value = node.getValue();
            int annotationEnd = node.getStartPosition() + node.getLength();
            int valueEnd = value.getStartPosition() + value.getLength();
            if (annotationEnd == valueEnd) {
                node.setFlags(node.getFlags() | 8);
            }
        }
    }
}
