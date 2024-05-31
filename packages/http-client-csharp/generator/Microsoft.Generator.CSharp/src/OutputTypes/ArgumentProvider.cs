// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    internal class ArgumentProvider : TypeProvider
    {
        private static readonly Lazy<ArgumentProvider> _instance = new(() => new ArgumentProvider());

        private class Template<T> { }

        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";

        private readonly CSharpType _t = typeof(Template<>).GetGenericArguments()[0];
        private readonly Parameter _nameParam = new Parameter("name", null, typeof(string), null, ValidationType.None, null);
        private readonly CSharpType _nullableT;
        private readonly ParameterReference _nameParamRef;

        public static ArgumentProvider Instance => _instance.Value;

        private ArgumentProvider() : base(null)
        {
            _nameParamRef = new ParameterReference(_nameParam);
            _nullableT = _t.WithNullable(true);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        public override string Name => "Argument";

        private MethodSignature GetSignature(
            string name,
            IReadOnlyList<Parameter> parameters,
            IReadOnlyList<CSharpType>? genericArguments = null,
            IReadOnlyList<WhereExpression>? whereExpressions = null,
            CSharpType? returnType = null)
        {
            return new MethodSignature(
                name,
                null,
                null,
                MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                returnType,
                null,
                parameters,
                GenericArguments: genericArguments,
                GenericParameterConstraints: whereExpressions);
        }

        protected override CSharpMethod[] BuildMethods()
        {
            return
            [
                BuildAssertNotNull(),
              //  BuildAssertNotNullStruct(), // Currently, `_nullableT` returns `T` instead of `T?`. Tracking issue here: https://github.com/microsoft/typespec/issues/3490
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


        private CSharpMethod BuildAssertNull()
        {
            var valueParam = new Parameter("value", null, _t, null, ValidationType.None, null);
            var messageParam = new Parameter("message", null, typeof(string), DefaultOf(new CSharpType(typeof(string), true)), ValidationType.None, null);
            var signature = GetSignature("AssertNull", new[] { valueParam, _nameParam, messageParam }, new[] { _t });
            var value = new ParameterReference(valueParam);
            var message = new ParameterReference(messageParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(value, Null))
                {
                    ThrowArgumentException(NullCoalescing(message, Literal("Value must be null.")))
                }
            });
        }

        private CSharpMethod BuildCheckNotNullOrEmptyString()
        {
            var valueParam = new Parameter("value", null, typeof(string), null, ValidationType.None, null);
            var signature = GetSignature("CheckNotNullOrEmpty", new[] { valueParam, _nameParam }, returnType: typeof(string));
            var value = new ParameterReference(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullOrEmpty(value, _nameParamRef),
                Return(value)
            });
        }


        private CSharpMethod BuildCheckNotNull()
        {
            var valueParam = new Parameter("value", null, _t, null, ValidationType.None, null);
            var signature = GetSignature("CheckNotNull", new[] { valueParam, _nameParam }, new[] { _t }, new[] { Where.Class(_t) }, _t);
            var value = new ParameterReference(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNull(value, _nameParamRef),
                Return(value)
            });
        }

        private CSharpMethod BuildAssertEnumDefined()
        {
            var valueParam = new Parameter("value", null, typeof(object), null, ValidationType.None, null);
            var enumTypeParam = new Parameter("enumType", null, typeof(Type), null, ValidationType.None, null);
            var signature = GetSignature("AssertEnumDefined", new[] { enumTypeParam, valueParam, _nameParam });
            var enumType = new ParameterReference(enumTypeParam);
            var value = new ParameterReference(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(Not(new BoolExpression(new InvokeStaticMethodExpression(typeof(Enum), "IsDefined", new[] { enumType, value }))))
                {
                    ThrowArgumentException(new FormattableStringExpression("Value not defined for {0}.", new MemberExpression(enumType, "FullName")))
                }
            });
        }

        private CSharpMethod BuildAssertInRange()
        {
            var valueParam = new Parameter("value", null, _t, null, ValidationType.None, null);
            var minParam = new Parameter("minimum", null, _t, null, ValidationType.None, null);
            var maxParam = new Parameter("maximum", null, _t, null, ValidationType.None, null);
            var whereExpressions = new WhereExpression[] { Where.NotNull(_t).And(new CSharpType(typeof(IComparable<>), _t)) };
            var signature = GetSignature("AssertInRange", new[] { valueParam, minParam, maxParam, _nameParam }, new[] { _t }, whereExpressions);
            var value = new ParameterReference(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(GreaterThan(GetCompareToExpression(new ParameterReference(minParam), value), Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParamRef, "Value is less than the minimum allowed.", false))
                },
                new IfStatement(LessThan(GetCompareToExpression(new ParameterReference(maxParam), value), Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParamRef, "Value is greater than the maximum allowed.", false))
                }
            });
        }

        private ValueExpression GetCompareToExpression(ValueExpression left, ValueExpression right)
        {
            return left.Invoke("CompareTo", right);
        }

        private CSharpMethod BuildAssertNotDefault()
        {
            var valueParam = new Parameter("value", null, _t, null, ValidationType.None, null);
            var whereExpressions = new WhereExpression[] { Where.Struct(_t).And(new CSharpType(typeof(IEquatable<>), _t)) };
            var signature = GetSignature("AssertNotDefault", new[] { valueParam.WithRef(), _nameParam }, new[] { _t }, whereExpressions);
            var value = new ParameterReference(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(new BoolExpression(value.Invoke("Equals", Default)))
                {
                    ThrowArgumentException("Value cannot be empty.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrWhiteSpace()
        {
            var valueParam = new Parameter("value", null, typeof(string), null, ValidationType.None, null);
            var signature = GetSignature(AssertNotNullOrWhiteSpaceMethodName, new[] { valueParam, _nameParam });
            var value = new StringExpression(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(StringExpression.IsNullOrWhiteSpace(value))
                {
                    ThrowArgumentException("Value cannot be empty or contain only white-space characters.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrEmptyString()
        {
            var valueParam = new Parameter("value", null, typeof(string), null, ValidationType.None, null);
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, new[] { valueParam, _nameParam });
            var value = new StringExpression(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(Equal(value.Length, Literal(0)))
                {
                    ThrowArgumentException("Value cannot be an empty string.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrEmptyCollection()
        {
            const string throwMessage = "Value cannot be an empty collection.";
            var valueParam = new Parameter("value", null, new CSharpType(typeof(IEnumerable<>), _t), null, ValidationType.None, null);
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, new[] { valueParam, _nameParam }, new[] { _t });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(IsCollectionEmpty(valueParam, new VariableReference(new CSharpType(typeof(ICollection<>), _t), new CodeWriterDeclaration("collectionOfT"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                new IfStatement(IsCollectionEmpty(valueParam, new VariableReference(typeof(ICollection), new CodeWriterDeclaration("collection"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                UsingDeclare("e", new CSharpType(typeof(IEnumerator<>), _t), new ParameterReference(valueParam).Invoke("GetEnumerator"), out var eVar),
                new IfStatement(Not(new BoolExpression(eVar.Invoke("MoveNext"))))
                {
                    ThrowArgumentException(throwMessage)
                }
            });
        }

        private static BoolExpression IsCollectionEmpty(Parameter valueParam, VariableReference collection)
        {
            return BoolExpression.Is(valueParam, new DeclarationExpression(collection, false)).And(Equal(new MemberExpression(collection, "Count"), Literal(0)));
        }

        private MethodBodyStatement ThrowArgumentException(ValueExpression expression)
        {
            return Throw(New.ArgumentException(_nameParamRef, expression, false));
        }

        private MethodBodyStatement ThrowArgumentException(string message) => ThrowArgumentException(Literal(message));

        // Currently, `_nullableT` returns `T` instead of `T?`. Tracking issue here: https://github.com/microsoft/typespec/issues/3490
        //private CSharpMethod BuildAssertNotNullStruct()
        //{
        //    var valueParam = new Parameter("value", null, _nullableT, null, ValidationType.None, null);
        //    var signature = GetSignature(AssertNotNullMethodName, new[] { valueParam, _nameParam }, new[] { _t }, new[] { Where.Struct(_t) });
        //    var value = new ParameterReference(valueParam);
        //    return new CSharpMethod(signature, new MethodBodyStatement[]
        //    {
        //        new IfStatement(Not(new BoolExpression(new MemberExpression(value, "HasValue"))))
        //        {
        //            Throw(New.ArgumentNullException(_nameParamRef, false))ChangeTrackingDictionaryTestChangeTrackingDictionaryTest
        //        }
        //    });
        //}

        private CSharpMethod BuildAssertNotNull()
        {
            var valueParam = new Parameter("value", null, _t, null, ValidationType.None, null);
            var signature = GetSignature(AssertNotNullMethodName, new[] { valueParam, _nameParam }, new[] { _t });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam)
            });
        }

        private IfStatement AssertNotNullSnippet(Parameter valueParam)
        {
            return new IfStatement(Is(new ParameterReference(valueParam), Null))
            {
                Throw(New.ArgumentNullException(_nameParamRef, false))
            };
        }

        internal MethodBodyStatement AssertNotNull(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullMethodName, variable, name ?? Nameof(variable));
        }

        internal MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullOrEmptyMethodName, variable, name ?? Nameof(variable));
        }

        internal MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullOrWhiteSpaceMethodName, variable, name ?? Nameof(variable));
        }
    }
}
