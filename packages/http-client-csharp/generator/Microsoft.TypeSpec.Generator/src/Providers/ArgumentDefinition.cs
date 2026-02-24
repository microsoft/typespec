// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.ArgumentSnippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;
using static Microsoft.TypeSpec.Generator.Snippets.StringSnippets;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal class ArgumentDefinition : TypeProvider
    {
        private class Template<T> { }

        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";
        private const string AssertInRangeMethodName = "AssertInRange";
        private const string CheckNotNullOrEmptyMethodName = "CheckNotNullOrEmpty";

        private readonly CSharpType _t = typeof(Template<>).GetGenericArguments()[0];
        private readonly ParameterProvider _nameParam = new ParameterProvider("name", $"The name.", typeof(string));
        private readonly CSharpType _nullableT;

        public ArgumentDefinition()
        {
            _nullableT = _t.WithNullable(true);
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        private MethodSignature GetSignature(
            string name,
            IReadOnlyList<ParameterProvider> parameters,
            IReadOnlyList<CSharpType>? genericArguments = null,
            IReadOnlyList<WhereExpression>? whereExpressions = null,
            CSharpType? returnType = null)
        {
            return new MethodSignature(
                name,
                null,
                MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                returnType,
                null,
                parameters,
                GenericArguments: genericArguments,
                GenericParameterConstraints: whereExpressions);
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "Argument";

        protected internal override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildAssertNotNull(),
                BuildAssertNotNullStruct(),
                BuildAssertNotNullOrEmptyCollection(),
                BuildAssertNotNullOrEmptyString(),
                BuildAssertNotNullOrWhiteSpace(),
                BuildAssertInRange(),
                BuildCheckNotNullOrEmpty(),
            ];
        }

        private MethodProvider BuildAssertNotNullOrWhiteSpace()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrWhiteSpaceMethodName, [valueParam, _nameParam]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(IsNullOrWhiteSpace(valueParam.As<string>()))
                {
                    ThrowArgumentException("Value cannot be empty or contain only white-space characters.")
                }
            },
            this);
        }

        private MethodProvider BuildAssertInRange()
        {
            var valueParam = new ParameterProvider("value", $"The value.", _t);
            var minimumParam = new ParameterProvider("minimum", $"The minimum value.", _t);
            var maximumParam = new ParameterProvider("maximum", $"The maximum value.", _t);
            var whereExpression = Where.NotNull(_t).And(new CSharpType(typeof(IComparable<>), _t));
            var signature = GetSignature(AssertInRangeMethodName, [valueParam, minimumParam, maximumParam, _nameParam], [_t], [whereExpression]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(minimumParam.Invoke("CompareTo", valueParam).GreaterThan(Literal(0)))
                {
                    ThrowArgumentOutOfRangeException("Value is less than the minimum allowed.")
                },
                new IfStatement(maximumParam.Invoke("CompareTo", valueParam).LessThan(Literal(0)))
                {
                    ThrowArgumentOutOfRangeException("Value is greater than the maximum allowed.")
                }
            },
            this);
        }

        private MethodProvider BuildCheckNotNullOrEmpty()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature(CheckNotNullOrEmptyMethodName, [valueParam, _nameParam], returnType: typeof(string));
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Static<ArgumentDefinition>().Invoke(AssertNotNullOrEmptyMethodName, [valueParam, _nameParam]).Terminate(),
                Return(valueParam)
            },
            this);
        }

        private MethodBodyStatement ThrowArgumentOutOfRangeException(string message)
        {
            return Throw(New.ArgumentOutOfRangeException(_nameParam, message, false));
        }

        private MethodProvider BuildAssertNotNullOrEmptyString()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, [valueParam, _nameParam]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(valueParam.As<string>().Length().Equal(Literal(0)))
                {
                    ThrowArgumentException("Value cannot be an empty string.")
                }
            },
            this);
        }

        private MethodProvider BuildAssertNotNullOrEmptyCollection()
        {
            const string throwMessage = "Value cannot be an empty collection.";
            var value = new ParameterProvider("value", $"The value.", new CSharpType(typeof(IEnumerable<>), _t));
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, [value, _nameParam], [_t]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(value),
                new IfStatement(IsCollectionEmpty(value, new VariableExpression(new CSharpType(typeof(ICollection<>), _t), new CodeWriterDeclaration("collectionOfT"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                new IfStatement(IsCollectionEmpty(value, new VariableExpression(typeof(ICollection), new CodeWriterDeclaration("collection"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                UsingDeclare("e", new CSharpType(typeof(IEnumerator<>), _t), value.Invoke("GetEnumerator"), out var eVar),
                new IfStatement(Not(eVar.Invoke("MoveNext")))
                {
                    ThrowArgumentException(throwMessage)
                }
            },
            this);
        }

        private static ScopedApi<bool> IsCollectionEmpty(ParameterProvider valueParam, VariableExpression collection)
        {
            return valueParam.Is(new DeclarationExpression(collection)).And(new MemberExpression(collection, "Count").Equal(Literal(0)));
        }

        private MethodBodyStatement ThrowArgumentException(ValueExpression expression)
        {
            return Throw(New.ArgumentException(_nameParam, expression, false));
        }

        private MethodBodyStatement ThrowArgumentException(string message) => ThrowArgumentException(Literal(message));

        private MethodProvider BuildAssertNotNullStruct()
        {
            var value = new ParameterProvider("value", $"The value.", _nullableT);
            var signature = GetSignature(AssertNotNullMethodName, [value, _nameParam], [_t], [Where.Struct(_t)]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(Not(value.Property("HasValue")))
                {
                    Throw(New.ArgumentNullException(_nameParam, false))
                }
            },
            this);
        }

        private MethodProvider BuildAssertNotNull()
        {
            var valueParam = new ParameterProvider("value", $"The value.", _t);
            var signature = GetSignature(AssertNotNullMethodName, [valueParam, _nameParam], [_t]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam)
            },
            this);
        }

        private IfStatement AssertNotNullSnippet(ParameterProvider value)
        {
            return new IfStatement(value.Is(Null))
            {
                Throw(New.ArgumentNullException(_nameParam, false))
            };
        }
    }
}
