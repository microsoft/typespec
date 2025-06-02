// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Base class for visiting and potentially modifying the output library.
    /// </summary>
    public abstract class LibraryVisitor
    {
        protected internal virtual void VisitLibrary(OutputLibrary library)
        {
            // Ensure all types are built before visiting them
            foreach (var type in library.TypeProviders)
            {
                type.EnsureBuilt();
            }

            var types = new List<TypeProvider>();
            foreach (var typeProvider in library.TypeProviders)
            {
                var type = VisitTypeCore(typeProvider);
                if (type != null)
                {
                    types.Add(type);
                }
            }
            library.TypeProviders = types;
        }

        private TypeProvider? VisitTypeCore(TypeProvider typeProvider)
        {
            var type = VisitType(typeProvider);
            if (type != null)
            {
                var methods = new List<MethodProvider>();
                foreach (var methodProvider in typeProvider.Methods)
                {
                    var method = methodProvider.Accept(this);
                    if (method != null)
                    {
                        methods.Add(method);
                    }
                }

                var constructors = new List<ConstructorProvider>();
                foreach (var constructorProvider in typeProvider.Constructors)
                {
                    var constructor = VisitConstructor(constructorProvider);
                    if (constructor != null)
                    {
                        constructors.Add(constructor);
                    }
                }

                var properties = new List<PropertyProvider>();
                foreach (var propertyProvider in typeProvider.Properties)
                {
                    var property = VisitProperty(propertyProvider);
                    if (property != null)
                    {
                        properties.Add(property);
                    }
                }

                var fields = new List<FieldProvider>();
                foreach (var fieldProvider in typeProvider.Fields)
                {
                    var field = VisitField(fieldProvider);
                    if (field != null)
                    {
                        fields.Add(field);
                    }
                }

                var serializations = new List<TypeProvider>();
                foreach (var serializationProvider in typeProvider.SerializationProviders)
                {
                    var serialization = VisitTypeCore(serializationProvider);
                    if (serialization != null)
                    {
                        serializations.Add(serialization);
                    }
                }

                var nestedTypes = new List<TypeProvider>();
                foreach (var nestedTypeProvider in typeProvider.NestedTypes)
                {
                    var nestedType = VisitType(nestedTypeProvider);
                    if (nestedType != null)
                    {
                        nestedTypes.Add(nestedType);
                    }
                }

                type.Update(methods, constructors, properties, fields, serializations, nestedTypes);
                type = PostVisitType(type);
            }
            return type;
        }

        /// <summary>
        /// Visits an <see cref="InputModelType"/> and the converted <see cref="ModelProvider"/> and returns a possibly modified version of the <see cref="ModelProvider"/>.
        /// This method is called prior to returning the newly created <see cref="ModelProvider"/> from <see cref="TypeFactory.CreateModel"/>.
        /// </summary>
        /// <param name="model">The original input model.</param>
        /// <param name="type">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="ModelProvider"/>.</returns>
        protected internal virtual ModelProvider? PreVisitModel(InputModelType model, ModelProvider? type)
        {
            return type;
        }

        /// <summary>
        /// Visits an <see cref="InputModelProperty"/> and the converted <see cref="PropertyProvider"/> and returns a possibly modified version of the <see cref="PropertyProvider"/>.
        /// This method is called prior to returning the newly created <see cref="PropertyProvider"/> from <see cref="TypeFactory.CreateProperty"/>.
        /// </summary>
        /// <param name="property">The original input model property.</param>
        /// <param name="propertyProvider">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="PropertyProvider"/>.</returns>
        protected internal virtual PropertyProvider? PreVisitProperty(InputProperty property, PropertyProvider? propertyProvider)
        {
            return propertyProvider;
        }

        /// <summary>
        /// Visits an <see cref="InputEnumType"/> and the converted <see cref="EnumProvider"/> and returns a possibly modified version of the <see cref="TypeProvider"/>.
        /// This method is called prior to returning the newly created <see cref="EnumProvider"/> from <see cref="TypeFactory.CreateEnum"/>.
        /// </summary>
        /// <param name="enumType">The original input enum.</param>
        /// <param name="type">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="EnumProvider"/>.</returns>
        protected internal virtual EnumProvider? PreVisitEnum(InputEnumType enumType, EnumProvider? type)
        {
            return type;
        }

        /// <summary>
        /// Visits a <see cref="TypeProvider"/> and returns a possibly modified version of it. This method is called before visiting the
        /// type provider's members.
        /// </summary>
        /// <param name="type">The original <see cref="TypeProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider? VisitType(TypeProvider type)
        {
            return type;
        }

        /// <summary>
        /// Visits a <see cref="TypeProvider"/> after all its members have been visited and returns a possibly modified version of it.
        /// </summary>
        /// <param name="type">The original <see cref="TypeProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider? PostVisitType(TypeProvider type)
        {
            return type;
        }

        /// <summary>
        /// Visits a <see cref="ConstructorProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="constructor">The original <see cref="ConstructorProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="ConstructorProvider"/>.</returns>
        protected virtual ConstructorProvider? VisitConstructor(ConstructorProvider constructor)
        {
            return constructor;
        }

        /// <summary>
        /// Visits a <see cref="MethodProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="method">The original <see cref="MethodProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="MethodProvider"/>.</returns>
        protected internal virtual MethodProvider? VisitMethod(MethodProvider method)
        {
            return method;
        }

        protected internal virtual MethodBodyStatement? VisitStatements(MethodBodyStatements statements, MethodProvider method)
        {
            return statements;
        }

        protected internal virtual MethodBodyStatement? VisitExpressionStatement(ExpressionStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitIfStatement(IfStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual ValueExpression? VisitScopedApiExpression(ScopedApi expression, MethodProvider method)
        {
            return expression;
        }

        protected internal virtual MethodBodyStatement? VisitIfElseStatement(IfElseStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitTryCatchFinallyStatement(TryCatchFinallyStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitForStatement(ForStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitForEachStatement(ForEachStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitWhileStatement(WhileStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitSwitchStatement(SwitchStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual SwitchCaseStatement? VisitSwitchCaseStatement(SwitchCaseStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual MethodBodyStatement? VisitXmlDocInheritStatement(XmlDocInheritStatement statement, MethodProvider method)
        {
            return statement;
        }

        protected internal virtual ValueExpression? VisitMemberExpression(MemberExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual ValueExpression? VisitKeywordExpression(KeywordExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual ValueExpression? VisitDeclarationExpression(DeclarationExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual ValueExpression? VisitInvokeMethodExpression(InvokeMethodExpression expression, MethodProvider method)
        {
            return expression;
        }

        protected internal virtual VariableExpression VisitVariableExpression(VariableExpression expression, MethodProvider method)
        {
            return expression;
        }

        protected internal virtual ValueExpression? VisitAssignmentExpression(AssignmentExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual TryExpression VisitTryExpression(TryExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual CatchExpression VisitCatchExpression(CatchExpression expression, MethodProvider method)
        {
            return expression;
        }
        protected internal virtual FinallyExpression VisitFinallyExpression(FinallyExpression expression, MethodProvider method)
        {
            return expression;
        }

        /// <summary>
        /// Visits a <see cref="PropertyProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="property">The original <see cref="PropertyProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="PropertyProvider"/>.</returns>
        protected virtual PropertyProvider? VisitProperty(PropertyProvider property)
        {
            return property;
        }

        /// <summary>
        /// Visits a <see cref="FieldProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="field">The original <see cref="FieldProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="FieldProvider"/>.</returns>
        protected virtual FieldProvider? VisitField(FieldProvider field)
        {
            return field;
        }
    }
}
