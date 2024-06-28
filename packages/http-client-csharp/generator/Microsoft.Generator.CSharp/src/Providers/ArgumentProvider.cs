// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using static Microsoft.Generator.CSharp.Snippets.ArgumentSnippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class ArgumentProvider : TypeProvider
    {
        private class Template<T> { }

        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";

        private readonly CSharpType _t = typeof(Template<>).GetGenericArguments()[0];
        private readonly ParameterProvider _nameParam = new ParameterProvider("name", $"The name.", typeof(string));
        private readonly CSharpType _nullableT;

        public ArgumentProvider()
        {
            _nullableT = _t.WithNullable(true);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        public override string Name => "Argument";

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

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildAssertNotNull(),
                BuildAssertNotNullStruct(),
                BuildAssertNotNullOrEmptyCollection(),
                BuildAssertNotNullOrEmptyString(),
                BuildAssertNotNullOrWhiteSpace(),
                BuildAssertNotDefault(),
                BuildAssertInRange(),
                BuildAssertEnumDefined(),
                BuildCheckNotNull(),
                BuildCheckNotNullOrEmptyString(),
                BuildAssertNull(),
            ];
        }

        private MethodProvider BuildAssertNull()
        {
            var value = new ParameterProvider("value", $"The value.", _t);
            var message = new ParameterProvider("message", $"The message.", typeof(string), DefaultOf(new CSharpType(typeof(string), true)));
            var signature = GetSignature("AssertNull", [value, _nameParam, message], [_t]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(value.AsExpression.NotEqual(Null))
                {
                    ThrowArgumentException(NullCoalescing(message, Literal("Value must be null.")))
                }
            },
            this);
        }

        private MethodProvider BuildCheckNotNullOrEmptyString()
        {
            var value = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature("CheckNotNullOrEmpty", [value, _nameParam], returnType: typeof(string));
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullOrEmpty(value, _nameParam),
                Return(value)
            },
            this);
        }

        private MethodProvider BuildCheckNotNull()
        {
            var value = new ParameterProvider("value", $"The value.", _t);
            var signature = GetSignature("CheckNotNull", [value, _nameParam], new[] { _t }, new[] { Where.Class(_t) }, _t);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNull(value, _nameParam),
                Return(value)
            },
            this);
        }

        private MethodProvider BuildAssertEnumDefined()
        {
            var value = new ParameterProvider("value", $"The value.", typeof(object), null);
            var enumType = new ParameterProvider("enumType", $"The enum value.", typeof(Type));
            var signature = GetSignature("AssertEnumDefined", [enumType, value, _nameParam]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(Not(new BoolSnippet(new InvokeStaticMethodExpression(typeof(Enum), "IsDefined", [enumType, value]))))
                {
                    ThrowArgumentException(new FormattableStringExpression("Value not defined for {0}.", [new MemberExpression(enumType, "FullName")]))
                }
            },
            this);
        }

        private MethodProvider BuildAssertInRange()
        {
            var value = new ParameterProvider("value", $"The value.", _t);
            var min = new ParameterProvider("minimum", $"The minimum value.", _t);
            var max = new ParameterProvider("maximum", $"The maximum value.", _t);
            var whereExpressions = new WhereExpression[] { Where.NotNull(_t).And(new CSharpType(typeof(IComparable<>), _t)) };
            var signature = GetSignature("AssertInRange", new[] { value, min, max, _nameParam }, new[] { _t }, whereExpressions);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(GetCompareToExpression(min, value).GreaterThan(Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParam, "Value is less than the minimum allowed.", false))
                },
                new IfStatement(GetCompareToExpression(max, value).LessThan(Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParam, "Value is greater than the maximum allowed.", false))
                }
            },
            this);
        }

        private ValueExpression GetCompareToExpression(ValueExpression left, ValueExpression right)
        {
            return left.Invoke("CompareTo", right);
        }

        private MethodProvider BuildAssertNotDefault()
        {
            var value = new ParameterProvider("value", $"The value.", _t);
            var valueParamWithRef = new ParameterProvider("value", $"The value.", _t, null, true);
            var whereExpressions = new WhereExpression[] { Where.Struct(_t).And(new CSharpType(typeof(IEquatable<>), _t)) };
            var signature = GetSignature("AssertNotDefault", [valueParamWithRef, _nameParam], [_t], whereExpressions);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(new BoolSnippet(value.Invoke("Equals", Default)))
                {
                    ThrowArgumentException("Value cannot be empty.")
                }
            },
            this);
        }

        private MethodProvider BuildAssertNotNullOrWhiteSpace()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrWhiteSpaceMethodName, [valueParam, _nameParam]);
            var value = new StringSnippet(valueParam);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(StringSnippet.IsNullOrWhiteSpace(value))
                {
                    ThrowArgumentException("Value cannot be empty or contain only white-space characters.")
                }
            },
            this);
        }

        private MethodProvider BuildAssertNotNullOrEmptyString()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, [valueParam, _nameParam]);
            var value = new StringSnippet(valueParam);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(value.Length.Equal(Literal(0)))
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
                new IfStatement(Not(new BoolSnippet(eVar.Invoke("MoveNext"))))
                {
                    ThrowArgumentException(throwMessage)
                }
            },
            this);
        }

        private static BoolSnippet IsCollectionEmpty(ParameterProvider valueParam, VariableExpression collection)
        {
            return valueParam.AsExpression.Is(new DeclarationExpression(collection)).And(new MemberExpression(collection, "Count").Equal(Literal(0)));
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
                new IfStatement(Not(new BoolSnippet(new MemberExpression(value, "HasValue"))))
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
            return new IfStatement(value.AsExpression.Is(Null))
            {
                Throw(New.ArgumentNullException(_nameParam, false))
            };
        }
    }
}
