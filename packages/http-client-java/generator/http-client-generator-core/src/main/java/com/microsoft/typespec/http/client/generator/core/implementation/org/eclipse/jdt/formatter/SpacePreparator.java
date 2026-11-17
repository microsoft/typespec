// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] IndexOutOfBoundsException in TokenManager - https://bugs.eclipse.org/462945
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     IBM Corporation - DOM AST changes for JEP 354
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.InfixExpression.Operator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

public class SpacePreparator extends ASTVisitor {

    private static final Map<Operator, Predicate<DefaultCodeFormatterOptions>> SPACE_BEFORE_OPERATOR;
    private static final Map<Operator, Predicate<DefaultCodeFormatterOptions>> SPACE_AFTER_OPERATOR;

    static {
        Map<Operator, Predicate<DefaultCodeFormatterOptions>> spaceBeforeOperator = new HashMap<>();
        Map<Operator, Predicate<DefaultCodeFormatterOptions>> spaceAfterOperator = new HashMap<>();
        for (Operator op : Arrays.asList(Operator.TIMES, Operator.DIVIDE, Operator.REMAINDER)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_multiplicative_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_multiplicative_operator);
        }
        for (Operator op : Arrays.asList(Operator.PLUS, Operator.MINUS)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_additive_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_additive_operator);
        }
        for (Operator op : Arrays.asList(Operator.LEFT_SHIFT, Operator.RIGHT_SHIFT_SIGNED,
            Operator.RIGHT_SHIFT_UNSIGNED)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_shift_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_shift_operator);
        }
        for (Operator op : Arrays.asList(Operator.LESS, Operator.GREATER, Operator.LESS_EQUALS, Operator.GREATER_EQUALS,
            Operator.EQUALS, Operator.NOT_EQUALS)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_relational_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_relational_operator);
        }
        for (Operator op : Arrays.asList(Operator.AND, Operator.XOR, Operator.OR)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_bitwise_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_bitwise_operator);
        }
        for (Operator op : Arrays.asList(Operator.CONDITIONAL_AND, Operator.CONDITIONAL_OR)) {
            spaceBeforeOperator.put(op, o -> o.insert_space_before_logical_operator);
            spaceAfterOperator.put(op, o -> o.insert_space_after_logical_operator);
        }
        SPACE_BEFORE_OPERATOR = Collections.unmodifiableMap(spaceBeforeOperator);
        SPACE_AFTER_OPERATOR = Collections.unmodifiableMap(spaceAfterOperator);
    }

    TokenManager tm;
    private final DefaultCodeFormatterOptions options;

    public SpacePreparator(TokenManager tokenManager, DefaultCodeFormatterOptions options) {
        this.tm = tokenManager;
        this.options = options;
    }

    @Override
    public boolean preVisit2(ASTNode node) {
        return (node.getFlags() & 1) == 0;
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        handleSemicolon(node);
        return true;
    }

    @Override
    public boolean visit(ImportDeclaration node) {
        handleSemicolon(node);
        return true;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        if (this.tm.isFake(node))
            return true;

        handleToken(node.getName(), TokenNameIdentifier, true, false);

        List<TypeParameter> typeParameters = node.typeParameters();
        handleTypeParameters(typeParameters);

        if (!node.superInterfaceTypes().isEmpty())
            handleTokenAfter(node.getName(), node.isInterface() ? TokenNameextends : TokenNameimplements, true, true);
        if (node.getSuperclassType() != null)
            handleTokenAfter(node.getName(), TokenNameextends, true, true);

        handleToken(node.getName(), TokenNameLBRACE, this.options.insert_space_before_opening_brace_in_type_declaration,
            false);
        handleCommas(node.superInterfaceTypes(), this.options.insert_space_before_comma_in_superinterfaces,
            this.options.insert_space_after_comma_in_superinterfaces);
        return true;
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        handleToken(node.getName(), TokenNameLBRACE, this.options.insert_space_before_opening_brace_in_enum_declaration,
            false);
        handleCommas(node.superInterfaceTypes(), this.options.insert_space_before_comma_in_superinterfaces,
            this.options.insert_space_after_comma_in_superinterfaces);
        handleCommas(node.enumConstants(), this.options.insert_space_before_comma_in_enum_declarations,
            this.options.insert_space_after_comma_in_enum_declarations);
        return true;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        List<Expression> arguments = node.arguments();
        Token openingParen = null;
        if (!arguments.isEmpty()) {
            openingParen = this.tm.firstTokenIn(node, TokenNameLPAREN);
            if (this.options.insert_space_after_opening_paren_in_enum_constant)
                openingParen.spaceAfter();
            handleTokenAfter(arguments.get(arguments.size() - 1), TokenNameRPAREN,
                this.options.insert_space_before_closing_paren_in_enum_constant, false);
        } else {
            // look for empty parenthesis, may not be there
            int from = this.tm.firstIndexIn(node.getName(), TokenNameIdentifier) + 1;
            AnonymousClassDeclaration classDeclaration = node.getAnonymousClassDeclaration();
            int to = classDeclaration != null
                ? this.tm.firstIndexBefore(classDeclaration, TerminalToken.TokenNameInvalid)
                : this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            for (int i = from; i <= to; i++) {
                if (this.tm.get(i).tokenType == TokenNameLPAREN) {
                    openingParen = this.tm.get(i);
                    if (this.options.insert_space_between_empty_parens_in_enum_constant)
                        openingParen.spaceAfter();
                    break;
                }
            }
        }
        if (openingParen != null && this.options.insert_space_before_opening_paren_in_enum_constant)
            openingParen.spaceBefore();
        handleCommas(arguments, this.options.insert_space_before_comma_in_enum_constant_arguments,
            this.options.insert_space_after_comma_in_enum_constant_arguments);
        return true;
    }

    @Override
    public boolean visit(AnonymousClassDeclaration node) {
        boolean spaceBeforeOpenBrace = this.options.insert_space_before_opening_brace_in_anonymous_type_declaration;
        if (node.getParent() instanceof EnumConstantDeclaration)
            spaceBeforeOpenBrace = this.options.insert_space_before_opening_brace_in_enum_constant;
        handleToken(node, TokenNameLBRACE, spaceBeforeOpenBrace, false);
        return true;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        handleToken(node.getName(), TokenNameIdentifier, true, false);

        List<SingleVariableDeclaration> params = node.parameters();
        if (!node.isCompactConstructor()) {
            boolean beforeOpenParen = node.isConstructor()
                ? this.options.insert_space_before_opening_paren_in_constructor_declaration
                : this.options.insert_space_before_opening_paren_in_method_declaration;
            boolean afterOpenParen = node.isConstructor()
                ? this.options.insert_space_after_opening_paren_in_constructor_declaration
                : this.options.insert_space_after_opening_paren_in_method_declaration;
            boolean betweenEmptyParens = node.isConstructor()
                ? this.options.insert_space_between_empty_parens_in_constructor_declaration
                : this.options.insert_space_between_empty_parens_in_method_declaration;
            if (handleEmptyParens(node.getName(), betweenEmptyParens)) {
                handleToken(node.getName(), TokenNameLPAREN, beforeOpenParen, false);
            } else {
                handleToken(node.getName(), TokenNameLPAREN, beforeOpenParen, afterOpenParen);

                boolean beforeCloseParen = node.isConstructor()
                    ? this.options.insert_space_before_closing_paren_in_constructor_declaration
                    : this.options.insert_space_before_closing_paren_in_method_declaration;
                if (beforeCloseParen) {
                    ASTNode nodeBeforeBrace = params.isEmpty() ? node.getName() : params.get(params.size() - 1);
                    handleTokenAfter(nodeBeforeBrace, TokenNameRPAREN, true, false);
                }
            }

            boolean beforeComma = node.isConstructor()
                ? this.options.insert_space_before_comma_in_constructor_declaration_parameters
                : this.options.insert_space_before_comma_in_method_declaration_parameters;
            boolean afterComma = node.isConstructor()
                ? this.options.insert_space_after_comma_in_constructor_declaration_parameters
                : this.options.insert_space_after_comma_in_method_declaration_parameters;
            if (node.getReceiverType() != null) {
                params = new ArrayList<>(params);
                params.add(0, null); // space for explicit receiver, null OK - first value not read in handleCommas
            }
            handleCommas(params, beforeComma, afterComma);
        }

        boolean beforeOpeningBrace = node.isCompactConstructor()
            ? this.options.insert_space_before_opening_brace_in_record_constructor
            : node.isConstructor()
                ? this.options.insert_space_before_opening_brace_in_constructor_declaration
                : this.options.insert_space_before_opening_brace_in_method_declaration;
        if (beforeOpeningBrace && node.getBody() != null)
            this.tm.firstTokenIn(node.getBody(), TokenNameLBRACE).spaceBefore();

        if (node.getReceiverType() != null)
            this.tm.lastTokenIn(node.getReceiverType(), TerminalToken.TokenNameInvalid).spaceAfter();

        List<Type> thrownExceptionTypes = node.thrownExceptionTypes();
        if (!thrownExceptionTypes.isEmpty()) {
            handleTokenBefore(thrownExceptionTypes.get(0), TokenNamethrows, true, false);

            boolean beforeComma = node.isConstructor()
                ? this.options.insert_space_before_comma_in_constructor_declaration_throws
                : this.options.insert_space_before_comma_in_method_declaration_throws;
            boolean afterComma = node.isConstructor()
                ? this.options.insert_space_after_comma_in_constructor_declaration_throws
                : this.options.insert_space_after_comma_in_method_declaration_throws;
            handleCommas(thrownExceptionTypes, beforeComma, afterComma);
        }

        List<TypeParameter> typeParameters = node.typeParameters();
        if (!typeParameters.isEmpty()) {
            handleTypeParameters(typeParameters);
            handleTokenBefore(typeParameters.get(0), TokenNameLESS, true, false);
            handleTokenAfter(typeParameters.get(typeParameters.size() - 1), TokenNameGREATER, false, true);
        }

        handleSemicolon(node);
        return true;
    }

    private void handleTypeParameters(List<TypeParameter> typeParameters) {
        if (!typeParameters.isEmpty()) {
            handleTokenBefore(typeParameters.get(0), TokenNameLESS,
                this.options.insert_space_before_opening_angle_bracket_in_type_parameters,
                this.options.insert_space_after_opening_angle_bracket_in_type_parameters);
            handleTokenAfter(typeParameters.get(typeParameters.size() - 1), TokenNameGREATER,
                this.options.insert_space_before_closing_angle_bracket_in_type_parameters,
                this.options.insert_space_after_closing_angle_bracket_in_type_parameters);
            handleCommas(typeParameters, this.options.insert_space_before_comma_in_type_parameters,
                this.options.insert_space_after_comma_in_type_parameters);
        }
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        handleToken((ASTNode) node.fragments().get(0), TokenNameIdentifier, true, false);
        handleCommas(node.fragments(), this.options.insert_space_before_comma_in_multiple_field_declarations,
            this.options.insert_space_after_comma_in_multiple_field_declarations);
        handleSemicolon(node);
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        handleToken((ASTNode) node.fragments().get(0), TokenNameIdentifier, true, false);
        handleCommas(node.fragments(), this.options.insert_space_before_comma_in_multiple_local_declarations,
            this.options.insert_space_after_comma_in_multiple_local_declarations);
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationFragment node) {
        if (node.getInitializer() != null) {
            handleToken(node.getName(), TokenNameEQUAL, this.options.insert_space_before_assignment_operator,
                this.options.insert_space_after_assignment_operator);
        }
        return true;
    }

    @Override
    public void endVisit(SingleVariableDeclaration node) {
        // this must be endVisit in case a space added by a visit on a child node needs to be cleared
        if (node.isVarargs()) {
            handleTokenBefore(node.getName(), TokenNameELLIPSIS, this.options.insert_space_before_ellipsis,
                this.options.insert_space_after_ellipsis);
            List<Annotation> varargsAnnotations = node.varargsAnnotations();
            if (!varargsAnnotations.isEmpty()) {
                this.tm.firstTokenIn(varargsAnnotations.get(0), TokenNameAT).spaceBefore();
                this.tm
                    .lastTokenIn(varargsAnnotations.get(varargsAnnotations.size() - 1), TerminalToken.TokenNameInvalid)
                    .clearSpaceAfter();
            }
        } else {
            handleToken(node.getName(), TokenNameIdentifier, true, false);
        }
    }

    @Override
    public boolean visit(SwitchStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_switch,
            this.options.insert_space_after_opening_paren_in_switch);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN,
            this.options.insert_space_before_closing_paren_in_switch, false);
        handleTokenAfter(node.getExpression(), TokenNameLBRACE,
            this.options.insert_space_before_opening_brace_in_switch, false);
        handleSemicolon(node.statements());
        return true;
    }

    @Override
    public boolean visit(SwitchExpression node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_switch,
            this.options.insert_space_after_opening_paren_in_switch);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN,
            this.options.insert_space_before_closing_paren_in_switch, false);
        handleTokenAfter(node.getExpression(), TokenNameLBRACE,
            this.options.insert_space_before_opening_brace_in_switch, false);
        handleSemicolon(node.statements());
        return true;
    }

    @Override
    public boolean visit(SwitchCase node) {
        if (node.isSwitchLabeledRule()) {
            handleToken(this.tm.lastTokenIn(node, TokenNameARROW),
                node.isDefault()
                    ? this.options.insert_space_before_arrow_in_switch_default
                    : this.options.insert_space_before_arrow_in_switch_case,
                node.isDefault()
                    ? this.options.insert_space_after_arrow_in_switch_default
                    : this.options.insert_space_after_arrow_in_switch_case);
        } else {
            handleToken(this.tm.lastTokenIn(node, TokenNameCOLON),
                node.isDefault()
                    ? this.options.insert_space_before_colon_in_default
                    : this.options.insert_space_before_colon_in_case,
                false);
        }
        if (!node.isDefault()) {
            handleToken(node, TokenNamecase, false, true);
            handleCommas(node.expressions(), this.options.insert_space_before_comma_in_switch_case_expressions,
                this.options.insert_space_after_comma_in_switch_case_expressions);
        }
        return true;
    }

    @Override
    public boolean visit(YieldStatement node) {
        if (node.getExpression() != null && !node.isImplicit()) {
            this.tm.firstTokenIn(node, TerminalToken.TokenNameInvalid).spaceAfter();
        }
        return true;
    }

    @Override
    public boolean visit(DoStatement node) {
        handleTokenBefore(node.getExpression(), TokenNameLPAREN,
            this.options.insert_space_before_opening_paren_in_while,
            this.options.insert_space_after_opening_paren_in_while);
        handleTokenBefore(node.getExpression(), TokenNamewhile,
            !(node.getBody() instanceof Block) || this.options.insert_space_after_closing_brace_in_block, false);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_while,
            false);
        return true;
    }

    @Override
    public boolean visit(WhileStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_while,
            this.options.insert_space_after_opening_paren_in_while);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_while,
            false);
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(SynchronizedStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_synchronized,
            this.options.insert_space_after_opening_paren_in_synchronized);
        handleTokenBefore(node.getBody(), TokenNameRPAREN,
            this.options.insert_space_before_closing_paren_in_synchronized, false);
        return true;
    }

    @Override
    public boolean visit(TryStatement node) {
        List<Expression> resources = node.resources();
        if (!resources.isEmpty()) {
            handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_try,
                this.options.insert_space_after_opening_paren_in_try);
            handleTokenBefore(node.getBody(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_try,
                false);
            for (int i = 1; i < resources.size(); i++) {
                handleTokenBefore(resources.get(i), TokenNameSEMICOLON,
                    this.options.insert_space_before_semicolon_in_try_resources,
                    this.options.insert_space_after_semicolon_in_try_resources);
            }
            // there can be a semicolon after the last resource
            int index = this.tm.firstIndexAfter(resources.get(resources.size() - 1), TerminalToken.TokenNameInvalid);
            while (index < this.tm.size()) {
                Token token = this.tm.get(index++);
                if (token.tokenType == TokenNameSEMICOLON) {
                    handleToken(token, this.options.insert_space_before_semicolon_in_try_resources, false);
                } else if (token.tokenType == TokenNameRPAREN) {
                    break;
                }
            }
        }
        return true;
    }

    @Override
    public boolean visit(CatchClause node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_catch,
            this.options.insert_space_after_opening_paren_in_catch);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_catch,
            false);
        return true;
    }

    @Override
    public boolean visit(AssertStatement node) {
        this.tm.firstTokenIn(node, TokenNameassert).spaceAfter();
        if (node.getMessage() != null) {
            handleTokenBefore(node.getMessage(), TokenNameCOLON, this.options.insert_space_before_colon_in_assert,
                this.options.insert_space_after_colon_in_assert);
        }
        return true;
    }

    @Override
    public boolean visit(ReturnStatement node) {
        if (node.getExpression() != null) {
            int returnTokenIndex = this.tm.firstIndexIn(node, TokenNamereturn);
            if (!(node.getExpression() instanceof ParenthesizedExpression)
                || this.options.insert_space_before_parenthesized_expression_in_return) {
                this.tm.get(returnTokenIndex).spaceAfter();
            }
        }
        return true;
    }

    @Override
    public boolean visit(ThrowStatement node) {
        int returnTokenIndex = this.tm.firstIndexIn(node, TokenNamethrow);
        if (this.tm.get(returnTokenIndex + 1).tokenType != TokenNameLPAREN
            || this.options.insert_space_before_parenthesized_expression_in_throw) {
            this.tm.get(returnTokenIndex).spaceAfter();
        }
        return true;
    }

    @Override
    public boolean visit(LabeledStatement node) {
        handleToken(node, TokenNameCOLON, this.options.insert_space_before_colon_in_labeled_statement,
            this.options.insert_space_after_colon_in_labeled_statement);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        handleToken(node, TokenNameAT, this.options.insert_space_before_at_in_annotation_type_declaration,
            this.options.insert_space_after_at_in_annotation_type_declaration);
        handleToken(node.getName(), TokenNameLBRACE,
            this.options.insert_space_before_opening_brace_in_annotation_type_declaration, false);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        handleToken(node.getName(), TokenNameIdentifier, true, false);
        handleToken(node.getName(), TokenNameLPAREN,
            this.options.insert_space_before_opening_paren_in_annotation_type_member_declaration, false);
        handleEmptyParens(node.getName(),
            this.options.insert_space_between_empty_parens_in_annotation_type_member_declaration);
        if (node.getDefault() != null)
            handleTokenBefore(node.getDefault(), TokenNamedefault, true, true);
        return true;
    }

    @Override
    public boolean visit(NormalAnnotation node) {
        handleAnnotation(node, true);
        handleCommas(node.values(), this.options.insert_space_before_comma_in_annotation,
            this.options.insert_space_after_comma_in_annotation);
        return true;
    }

    @Override
    public boolean visit(MemberValuePair node) {
        handleToken(node, TokenNameEQUAL, this.options.insert_space_before_assignment_operator,
            this.options.insert_space_after_assignment_operator);
        return true;
    }

    @Override
    public boolean visit(SingleMemberAnnotation node) {
        handleAnnotation(node, true);
        return true;
    }

    @Override
    public boolean visit(MarkerAnnotation node) {
        handleAnnotation(node, false);
        return true;
    }

    private void handleAnnotation(Annotation node, boolean handleParenthesis) {
        handleToken(node, TokenNameAT, false, this.options.insert_space_after_at_in_annotation);
        if (handleParenthesis) {
            handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_annotation,
                this.options.insert_space_after_opening_paren_in_annotation);
            if (this.options.insert_space_before_closing_paren_in_annotation)
                this.tm.lastTokenIn(node, TokenNameRPAREN).spaceBefore();
        }

        ASTNode parent = node.getParent();
        boolean skipSpaceAfter = parent instanceof Annotation
            || parent instanceof MemberValuePair
            || (parent instanceof AnnotationTypeMemberDeclaration
                && ((AnnotationTypeMemberDeclaration) parent).getDefault() == node)
            || parent instanceof ArrayInitializer;
        if (!skipSpaceAfter)
            this.tm.lastTokenIn(node, TerminalToken.TokenNameInvalid).spaceAfter();
    }

    @Override
    public boolean visit(LambdaExpression node) {
        handleToken(node, TokenNameARROW, this.options.insert_space_before_lambda_arrow,
            this.options.insert_space_after_lambda_arrow);
        List<VariableDeclaration> parameters = node.parameters();
        if (node.hasParentheses()) {
            if (!handleEmptyParens(node, this.options.insert_space_between_empty_parens_in_method_declaration)) {
                handleToken(node, TokenNameLPAREN, false,
                    this.options.insert_space_after_opening_paren_in_method_declaration);

                handleTokenBefore(node.getBody(), TokenNameRPAREN,
                    this.options.insert_space_before_closing_paren_in_method_declaration, false);
            }
            handleCommas(parameters, this.options.insert_space_before_comma_in_method_declaration_parameters,
                this.options.insert_space_after_comma_in_method_declaration_parameters);
        }
        return true;
    }

    @Override
    public boolean visit(Block node) {
        handleSemicolon(node.statements());

        ASTNode parent = node.getParent();
        if (parent.getLength() == 0)
            return true; // this is a fake block created by parsing in statements mode
        if (parent instanceof MethodDeclaration)
            return true; // spaces handled in #visit(MethodDeclaration)

        handleToken(node, TokenNameLBRACE, this.options.insert_space_before_opening_brace_in_block, false);
        if (this.options.insert_space_after_closing_brace_in_block
            && (parent instanceof Statement || parent instanceof CatchClause)) {
            int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
            this.tm.get(closeBraceIndex).spaceAfter();
        }
        return true;
    }

    @Override
    public boolean visit(IfStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_if,
            this.options.insert_space_after_opening_paren_in_if);

        Statement thenStatement = node.getThenStatement();
        handleTokenBefore(thenStatement, TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_if, false);

        handleLoopBody(thenStatement);
        handleSemicolon(thenStatement);
        return true;
    }

    @Override
    public boolean visit(ForStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_for,
            this.options.insert_space_after_opening_paren_in_for);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_for,
            false);
        handleCommas(node.initializers(), this.options.insert_space_before_comma_in_for_inits,
            this.options.insert_space_after_comma_in_for_inits);
        handleCommas(node.updaters(), this.options.insert_space_before_comma_in_for_increments,
            this.options.insert_space_after_comma_in_for_increments);

        boolean part1Empty = node.initializers().isEmpty();
        boolean part2Empty = node.getExpression() == null;
        boolean part3Empty = node.updaters().isEmpty();
        handleToken(node, TokenNameSEMICOLON, this.options.insert_space_before_semicolon_in_for && !part1Empty,
            this.options.insert_space_after_semicolon_in_for && !part2Empty);
        handleTokenBefore(node.getBody(), TokenNameSEMICOLON,
            this.options.insert_space_before_semicolon_in_for && !part2Empty,
            this.options.insert_space_after_semicolon_in_for && !part3Empty);

        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        ASTNode parent = node.getParent();
        if (parent instanceof ForStatement) {
            handleCommas(node.fragments(), this.options.insert_space_before_comma_in_for_inits,
                this.options.insert_space_after_comma_in_for_inits);
        } else if (parent instanceof ExpressionStatement) {
            handleCommas(node.fragments(), this.options.insert_space_before_comma_in_multiple_local_declarations,
                this.options.insert_space_after_comma_in_multiple_local_declarations);
        }
        this.tm.firstTokenAfter(node.getType(), TerminalToken.TokenNameInvalid).spaceBefore();
        return true;
    }

    @Override
    public boolean visit(EnhancedForStatement node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_for,
            this.options.insert_space_after_opening_paren_in_for);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_for,
            false);
        handleTokenAfter(node.getParameter(), TokenNameCOLON, this.options.insert_space_before_colon_in_for,
            this.options.insert_space_after_colon_in_for);
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(MethodInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node, node.getName());
        handleCommas(node.arguments(), this.options.insert_space_before_comma_in_method_invocation_arguments,
            this.options.insert_space_after_comma_in_method_invocation_arguments);
        return true;
    }

    @Override
    public boolean visit(SuperMethodInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node, node.getName());
        handleCommas(node.arguments(), this.options.insert_space_before_comma_in_method_invocation_arguments,
            this.options.insert_space_after_comma_in_method_invocation_arguments);
        return true;
    }

    @Override
    public boolean visit(ClassInstanceCreation node) {
        List<Type> typeArguments = node.typeArguments();
        handleTypeArguments(typeArguments);
        handleInvocation(node, node.getType(), node.getAnonymousClassDeclaration());
        if (!typeArguments.isEmpty()) {
            handleTokenBefore(typeArguments.get(0), TokenNamenew, false, true); // fix for: new<Integer>A<String>()
        }
        handleCommas(node.arguments(), this.options.insert_space_before_comma_in_allocation_expression,
            this.options.insert_space_after_comma_in_allocation_expression);
        return true;
    }

    @Override
    public boolean visit(ConstructorInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node, node);
        handleCommas(node.arguments(), this.options.insert_space_before_comma_in_explicit_constructor_call_arguments,
            this.options.insert_space_after_comma_in_explicit_constructor_call_arguments);
        return true;
    }

    @Override
    public boolean visit(SuperConstructorInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node, node);
        handleCommas(node.arguments(), this.options.insert_space_before_comma_in_explicit_constructor_call_arguments,
            this.options.insert_space_after_comma_in_explicit_constructor_call_arguments);
        return true;
    }

    private void handleInvocation(ASTNode invocationNode, ASTNode nodeBeforeOpeningParen) {
        handleInvocation(invocationNode, nodeBeforeOpeningParen, null);
    }

    private void handleInvocation(ASTNode invocationNode, ASTNode nodeBeforeOpeningParen,
        ASTNode nodeAfterClosingParen) {
        if (handleEmptyParens(nodeBeforeOpeningParen,
            this.options.insert_space_between_empty_parens_in_method_invocation)) {
            handleToken(nodeBeforeOpeningParen, TokenNameLPAREN,
                this.options.insert_space_before_opening_paren_in_method_invocation, false);
        } else {
            handleToken(nodeBeforeOpeningParen, TokenNameLPAREN,
                this.options.insert_space_before_opening_paren_in_method_invocation,
                this.options.insert_space_after_opening_paren_in_method_invocation);
            if (this.options.insert_space_before_closing_paren_in_method_invocation) {
                Token closingParen = nodeAfterClosingParen == null
                    ? this.tm.lastTokenIn(invocationNode, TokenNameRPAREN)
                    : this.tm.firstTokenBefore(nodeAfterClosingParen, TokenNameRPAREN);
                closingParen.spaceBefore();
            }
        }
    }

    @Override
    public boolean visit(Assignment node) {
        handleOperator(node.getOperator().toString(), node.getRightHandSide(),
            this.options.insert_space_before_assignment_operator, this.options.insert_space_after_assignment_operator);
        return true;
    }

    @Override
    public boolean visit(InfixExpression node) {
        Operator operator = node.getOperator();
        boolean spaceBefore = SPACE_BEFORE_OPERATOR.get(operator).test(this.options);
        boolean spaceAfter = SPACE_AFTER_OPERATOR.get(operator).test(this.options);
        if (this.tm.isStringConcatenation(node)) {
            spaceBefore = this.options.insert_space_before_string_concatenation;
            spaceAfter = this.options.insert_space_after_string_concatenation;
        }
        handleOperator(operator.toString(), node.getRightOperand(), spaceBefore, spaceAfter);
        List<Expression> extendedOperands = node.extendedOperands();
        for (Expression operand : extendedOperands) {
            handleOperator(operator.toString(), operand, spaceBefore, spaceAfter);
        }
        return true;
    }

    @Override
    public boolean visit(PrefixExpression node) {
        PrefixExpression.Operator operator = node.getOperator();
        if (operator.equals(PrefixExpression.Operator.INCREMENT)
            || operator.equals(PrefixExpression.Operator.DECREMENT)) {
            handleOperator(operator.toString(), node.getOperand(), this.options.insert_space_before_prefix_operator,
                this.options.insert_space_after_prefix_operator);
        } else if (operator.equals(PrefixExpression.Operator.NOT)) {
            handleOperator(operator.toString(), node.getOperand(), this.options.insert_space_before_unary_operator,
                this.options.insert_space_after_not_operator);
        } else {
            handleOperator(operator.toString(), node.getOperand(), this.options.insert_space_before_unary_operator,
                this.options.insert_space_after_unary_operator);
        }
        return true;
    }

    @Override
    public boolean visit(PostfixExpression node) {
        if (this.options.insert_space_before_postfix_operator || this.options.insert_space_after_postfix_operator) {
            String operator = node.getOperator().toString();
            int i = this.tm.firstIndexAfter(node.getOperand(), TerminalToken.TokenNameInvalid);
            while (!operator.equals(this.tm.toString(i))) {
                i++;
            }
            handleToken(this.tm.get(i), this.options.insert_space_before_postfix_operator,
                this.options.insert_space_after_postfix_operator);
        }
        return true;
    }

    private void handleOperator(String operator, ASTNode nodeAfter, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            int i = this.tm.firstIndexBefore(nodeAfter, TerminalToken.TokenNameInvalid);
            while (!operator.equals(this.tm.toString(i))) {
                i--;
            }
            handleToken(this.tm.get(i), spaceBefore, spaceAfter);
        }
    }

    @Override
    public boolean visit(ParenthesizedExpression node) {
        handleToken(node, TokenNameLPAREN, this.options.insert_space_before_opening_paren_in_parenthesized_expression,
            this.options.insert_space_after_opening_paren_in_parenthesized_expression);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN,
            this.options.insert_space_before_closing_paren_in_parenthesized_expression, false);
        return true;
    }

    @Override
    public boolean visit(CastExpression node) {
        handleToken(node, TokenNameLPAREN, false, this.options.insert_space_after_opening_paren_in_cast);
        handleTokenBefore(node.getExpression(), TokenNameRPAREN, this.options.insert_space_before_closing_paren_in_cast,
            this.options.insert_space_after_closing_paren_in_cast);
        return true;
    }

    @Override
    public boolean visit(IntersectionType node) {
        List<Type> types = node.types();
        for (int i = 1; i < types.size(); i++)
            handleTokenBefore(types.get(i), TokenNameAND, this.options.insert_space_before_bitwise_operator,
                this.options.insert_space_after_bitwise_operator);
        return true;
    }

    @Override
    public boolean visit(ConditionalExpression node) {
        handleTokenBefore(node.getThenExpression(), TokenNameQUESTION,
            this.options.insert_space_before_question_in_conditional,
            this.options.insert_space_after_question_in_conditional);
        handleTokenBefore(node.getElseExpression(), TokenNameCOLON,
            this.options.insert_space_before_colon_in_conditional,
            this.options.insert_space_after_colon_in_conditional);
        return true;
    }

    @Override
    public boolean visit(ArrayType node) {
        ASTNode parent = node.getParent();
        boolean spaceBeofreOpening, spaceBetween;
        if (parent instanceof ArrayCreation) {
            spaceBeofreOpening = this.options.insert_space_before_opening_bracket_in_array_allocation_expression;
            spaceBetween = this.options.insert_space_between_empty_brackets_in_array_allocation_expression;
        } else {
            spaceBeofreOpening = this.options.insert_space_before_opening_bracket_in_array_type_reference;
            spaceBetween = this.options.insert_space_between_brackets_in_array_type_reference;
        }
        List<Dimension> dimensions = node.dimensions();
        for (Dimension dimension : dimensions) {
            handleToken(dimension, TokenNameLBRACKET, spaceBeofreOpening, false);
            handleEmptyBrackets(dimension, spaceBetween);
        }
        return true;
    }

    @Override
    public boolean visit(ArrayAccess node) {
        handleTokenBefore(node.getIndex(), TokenNameLBRACKET,
            this.options.insert_space_before_opening_bracket_in_array_reference,
            this.options.insert_space_after_opening_bracket_in_array_reference);
        handleTokenAfter(node.getIndex(), TokenNameRBRACKET,
            this.options.insert_space_before_closing_bracket_in_array_reference, false);
        return true;
    }

    @Override
    public boolean visit(ArrayCreation node) {
        List<Expression> dimensions = node.dimensions();
        for (Expression dimension : dimensions) {
            handleTokenBefore(dimension, TokenNameLBRACKET, false,
                this.options.insert_space_after_opening_bracket_in_array_allocation_expression);
            handleTokenAfter(dimension, TokenNameRBRACKET,
                this.options.insert_space_before_closing_bracket_in_array_allocation_expression, false);
        }
        return true;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        int openingBraceIndex = this.tm.firstIndexIn(node, TokenNameLBRACE);
        int closingBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        Token lastToken = this.tm.get(closingBraceIndex - 1);
        if (lastToken.tokenType == TokenNameLBRACE) {
            handleToken(this.tm.get(openingBraceIndex),
                this.options.insert_space_before_opening_brace_in_array_initializer
                    && !(node.getParent() instanceof ArrayInitializer)
                    && !(node.getParent() instanceof SingleMemberAnnotation),
                this.options.insert_space_between_empty_braces_in_array_initializer);
        } else {
            boolean endsWithComma = lastToken.tokenType == TokenNameCOMMA;
            handleToken(this.tm.get(openingBraceIndex),
                this.options.insert_space_before_opening_brace_in_array_initializer
                    && !(node.getParent() instanceof ArrayInitializer)
                    && !(node.getParent() instanceof SingleMemberAnnotation),
                this.options.insert_space_after_opening_brace_in_array_initializer
                    && !(endsWithComma && node.expressions().isEmpty()));
            handleCommas(node.expressions(), this.options.insert_space_before_comma_in_array_initializer,
                this.options.insert_space_after_comma_in_array_initializer);
            if (endsWithComma) {
                handleToken(lastToken, this.options.insert_space_before_comma_in_array_initializer, false); // this.options.insert_space_after_comma_in_array_initializer);
            }
            handleToken(this.tm.get(closingBraceIndex),
                this.options.insert_space_before_closing_brace_in_array_initializer
                    && !(endsWithComma && node.expressions().isEmpty()),
                false);
        }
        return true;
    }

    @Override
    public boolean visit(ParameterizedType node) {
        List<Type> typeArguments = node.typeArguments();
        boolean hasArguments = !typeArguments.isEmpty();
        handleTokenAfter(node.getType(), TokenNameLESS,
            this.options.insert_space_before_opening_angle_bracket_in_parameterized_type_reference,
            hasArguments && this.options.insert_space_after_opening_angle_bracket_in_parameterized_type_reference);
        if (hasArguments) {
            handleTokenAfter(typeArguments.get(typeArguments.size() - 1), TokenNameGREATER,
                this.options.insert_space_before_closing_angle_bracket_in_parameterized_type_reference, false);
            handleCommas(node.typeArguments(), this.options.insert_space_before_comma_in_parameterized_type_reference,
                this.options.insert_space_after_comma_in_parameterized_type_reference);
        }
        return true;
    }

    @Override
    public boolean visit(TypeParameter node) {
        List<Type> typeBounds = node.typeBounds();
        for (int i = 1; i < typeBounds.size(); i++) {
            handleTokenBefore(typeBounds.get(i), TokenNameAND, this.options.insert_space_before_and_in_type_parameter,
                this.options.insert_space_after_and_in_type_parameter);
        }
        return true;
    }

    @Override
    public boolean visit(WildcardType node) {
        handleToken(node, TokenNameQUESTION, this.options.insert_space_before_question_in_wilcard,
            this.options.insert_space_after_question_in_wilcard || node.getBound() != null);
        return true;
    }

    @Override
    public boolean visit(UnionType node) {
        List<Type> types = node.types();
        for (int i = 1; i < types.size(); i++)
            handleTokenBefore(types.get(i), TokenNameOR, this.options.insert_space_before_bitwise_operator,
                this.options.insert_space_after_bitwise_operator);
        return true;
    }

    @Override
    public boolean visit(Dimension node) {
        List<Annotation> annotations = node.annotations();
        if (!annotations.isEmpty())
            handleToken(annotations.get(0), TokenNameAT, true, false);
        return true;
    }

    @Override
    public boolean visit(TypeMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(ExpressionMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(SuperMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(CreationReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    private void handleTypeArguments(List<Type> typeArguments) {
        if (typeArguments.isEmpty())
            return;
        handleTokenBefore(typeArguments.get(0), TokenNameLESS,
            this.options.insert_space_before_opening_angle_bracket_in_type_arguments,
            this.options.insert_space_after_opening_angle_bracket_in_type_arguments);
        handleTokenAfter(typeArguments.get(typeArguments.size() - 1), TokenNameGREATER,
            this.options.insert_space_before_closing_angle_bracket_in_type_arguments,
            this.options.insert_space_after_closing_angle_bracket_in_type_arguments);
        handleCommas(typeArguments, this.options.insert_space_before_comma_in_type_arguments,
            this.options.insert_space_after_comma_in_type_arguments);
    }

    @Override
    public boolean visit(InstanceofExpression node) {
        handleTokenAfter(node.getLeftOperand(), TokenNameinstanceof, true, true);
        return true;
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        handleToken(node.getName(), TokenNameLBRACE, this.options.insert_space_before_opening_brace_in_type_declaration,
            false);
        return true;
    }

    @Override
    public boolean visit(ExportsDirective node) {
        handleModuleStatementCommas(node.modules());
        return true;
    }

    @Override
    public boolean visit(OpensDirective node) {
        handleModuleStatementCommas(node.modules());
        return true;
    }

    @Override
    public boolean visit(ProvidesDirective node) {
        handleModuleStatementCommas(node.implementations());
        return true;
    }

    private void handleModuleStatementCommas(List<Name> names) {
        // using settings for fields for now, add new settings if necessary
        handleCommas(names, this.options.insert_space_before_comma_in_multiple_field_declarations,
            this.options.insert_space_after_comma_in_multiple_field_declarations);
    }

    private void handleCommas(List<? extends ASTNode> nodes, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            for (int i = 1; i < nodes.size(); i++) {
                handleTokenBefore(nodes.get(i), TokenNameCOMMA, spaceBefore, spaceAfter);
            }
        }
    }

    private void handleToken(ASTNode node, TerminalToken tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.get(this.tm.findIndex(node.getStartPosition(), tokenType, true));
            // ^not the same as "firstTokenIn(node, tokenType)" - do not assert the token is inside the node
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleTokenBefore(ASTNode node, TerminalToken tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.firstTokenBefore(node, tokenType);
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleTokenAfter(ASTNode node, TerminalToken tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (tokenType == TokenNameGREATER) {
            // there could be ">>" or ">>>" instead, get rid of them
            int index = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            for (int i = index; i < index + 2; i++) {
                Token token = this.tm.get(i);
                if (token.tokenType == TokenNameRIGHT_SHIFT || token.tokenType == TokenNameUNSIGNED_RIGHT_SHIFT) {
                    this.tm.remove(i);
                    for (int j = 0; j < (token.tokenType == TokenNameRIGHT_SHIFT ? 2 : 3); j++) {
                        this.tm.insert(i + j,
                            new Token(token.originalStart + j, token.originalStart + j, TokenNameGREATER));
                    }
                }
            }
        }
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.firstTokenAfter(node, tokenType);
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleToken(Token token, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore)
            token.spaceBefore();
        if (spaceAfter)
            token.spaceAfter();
    }

    private boolean handleEmptyParens(ASTNode nodeBeforeParens, boolean insertSpace) {
        int openingIndex = this.tm.findIndex(nodeBeforeParens.getStartPosition(), TokenNameLPAREN, true);
        if (this.tm.get(openingIndex + 1).tokenType == TokenNameRPAREN) {
            if (insertSpace)
                this.tm.get(openingIndex).spaceAfter();
            return true;
        }
        return false;
    }

    private void handleEmptyBrackets(ASTNode nodeContainingBrackets, boolean insertSpace) {
        int openingIndex = this.tm.firstIndexIn(nodeContainingBrackets, TokenNameLBRACKET);
        if (this.tm.get(openingIndex + 1).tokenType == TokenNameRBRACKET) {
            if (insertSpace)
                this.tm.get(openingIndex).spaceAfter();
        }
    }

    private void handleSemicolon(ASTNode node) {
        if (this.options.insert_space_before_semicolon) {
            Token lastToken = this.tm.lastTokenIn(node, TerminalToken.TokenNameInvalid);
            if (lastToken.tokenType == TokenNameSEMICOLON)
                lastToken.spaceBefore();
        }
    }

    private void handleSemicolon(List<ASTNode> nodes) {
        if (this.options.insert_space_before_semicolon) {
            for (ASTNode node : nodes)
                handleSemicolon(node);
        }
    }

    private void handleLoopBody(Statement loopBody) {
        /* space before body statement may be needed if it will stay on the same line */
        int firstTokenIndex = this.tm.firstIndexIn(loopBody, TerminalToken.TokenNameInvalid);
        if (!(loopBody instanceof Block)
            && !(loopBody instanceof EmptyStatement)
            && !this.tm.get(firstTokenIndex - 1).isComment()) {
            this.tm.get(firstTokenIndex).spaceBefore();
        }
    }

    public void finishUp() {
        this.tm.traverse(0, new TokenTraverser() {
            boolean isPreviousJIDP = false;

            @Override
            protected boolean token(Token token, int index) {
                // put space between consecutive keywords, numbers or identifiers
                char c = SpacePreparator.this.tm.charAt(token.originalStart);
                boolean isJIDP = ScannerHelper.isJavaIdentifierPart(c);
                if ((isJIDP || c == '@') && this.isPreviousJIDP)
                    getPrevious().spaceAfter();
                this.isPreviousJIDP = isJIDP;

                switch (token.tokenType) {
                    case TokenNamePLUS:
                        if (getNext().tokenType == TokenNamePLUS || getNext().tokenType == TokenNamePLUS_PLUS)
                            token.spaceAfter();
                        break;

                    case TokenNameMINUS:
                        if (getNext().tokenType == TokenNameMINUS || getNext().tokenType == TokenNameMINUS_MINUS)
                            token.spaceAfter();
                        break;

                    default:
                        break;
                }
                return true;
            }
        });
    }
}
