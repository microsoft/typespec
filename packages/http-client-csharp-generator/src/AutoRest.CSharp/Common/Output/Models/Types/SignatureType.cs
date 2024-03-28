// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Shared;
using Microsoft.CodeAnalysis;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Models.Types
{
    /// <summary>
    /// This type holds three portions of codes:
    ///     - current
    ///     - custom
    ///     - baseline contract
    ///     current union custom compare with baseline contract outputs the changeset, we can apply different rules with it.
    /// </summary>
    internal class SignatureType
    {
        private readonly TypeFactory _typeFactory;
        private readonly string _namespace;
        private readonly string _name;
        private readonly SignatureType? _customization;
        private readonly SignatureType? _baselineContract;
        private readonly MethodChangeset? _methodChangeset;

        // Missing means the method with the same name is missing from the current contract
        // Updated means the method with the same name is updated in the current contract, and the list contains the previous method and current methods including overload ones
        private record MethodChangeset(IReadOnlyList<MethodSignature> Missing, IReadOnlyList<(List<MethodSignature> Current, MethodSignature Previous)> Updated) { }

        public SignatureType(TypeFactory typeFactory, IReadOnlyList<MethodSignature> methods, SourceInputModel? sourceInputModel, string @namespace, string name)
        {
            // This can only be used for Mgmt now, because there are custom/hand-written code in HLC can't be loaded into CsharpType such as generic methods
            if (!Configuration.AzureArm)
            {
                throw new InvalidOperationException("This type should only be used for Mgmt");
            }

            _typeFactory = typeFactory;
            Methods = methods;
            _namespace = @namespace;
            _name = name;
            if (sourceInputModel is not null)
            {
                _customization = new SignatureType(typeFactory, PopulateMethodsFromCompilation(sourceInputModel?.Customization), null, @namespace, name);
                _baselineContract = new SignatureType(typeFactory, PopulateMethodsFromCompilation(sourceInputModel?.PreviousContract), null, @namespace, name);
                _methodChangeset ??= CompareMethods(Methods.Union(_customization?.Methods ?? Array.Empty<MethodSignature>(), MethodSignature.ParameterAndReturnTypeEqualityComparer), _baselineContract?.Methods);
            }
        }

        private IReadOnlyList<Method>? _overloadMethods;
        public IReadOnlyList<Method> OverloadMethods => _overloadMethods ??= EnsureOverloadMethods();

        private IReadOnlyList<Method> EnsureOverloadMethods()
        {
            var overloadMethods = new List<Method>();
            if (_methodChangeset?.Updated is not { } updated)
            {
                return Array.Empty<Method>();
            }

            foreach (var (current, previous) in updated)
            {
                if (TryGetPreviousMethodWithLessOptionalParameters(current, previous, out var currentMethodToCall, out var missingParameters))
                {
                    var overloadMethodSignature = new OverloadMethodSignature(currentMethodToCall, previous.WithParametersRequired(), missingParameters, previous.Description);
                    var previousMethodSignature = overloadMethodSignature.PreviousMethodSignature with { Attributes = new CSharpAttribute[]{new CSharpAttribute(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never)) }};
                    overloadMethods.Add(new Method(previousMethodSignature, BuildOverloadMethodBody(overloadMethodSignature)));
                }
            }
            return overloadMethods;
        }

        private MethodBodyStatement BuildOverloadMethodBody(OverloadMethodSignature overloadMethodSignature)
            => Return(new InvokeInstanceMethodExpression(null, overloadMethodSignature.MethodSignature.Name, BuildOverloadMethodParameters(overloadMethodSignature), null, overloadMethodSignature.PreviousMethodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Async)));

        private IReadOnlyList<ValueExpression> BuildOverloadMethodParameters(OverloadMethodSignature overloadMethodSignature)
        {
            var parameters = new List<ValueExpression>();
            var set = overloadMethodSignature.MissingParameters.ToHashSet(Parameter.TypeAndNameEqualityComparer);
            foreach (var parameter in overloadMethodSignature.MethodSignature.Parameters)
            {
                if (set.Contains(parameter))
                {
                    parameters.Add(new PositionalParameterReference(parameter.Name, Default.CastTo(parameter.Type)));
                    continue;
                }
                parameters.Add(new PositionalParameterReference(parameter));
            }
            return parameters;
        }

        private IReadOnlySet<MethodSignature>? _methodsToSkip;
        public IReadOnlySet<MethodSignature> MethodsToSkip => _methodsToSkip ??= EnsureMethodsToSkip();
        private IReadOnlySet<MethodSignature> EnsureMethodsToSkip()
        {
            if (_customization is null)
            {
                return new HashSet<MethodSignature>();
            }
            return Methods.Intersect(_customization.Methods, MethodSignature.ParameterAndReturnTypeEqualityComparer).ToHashSet(MethodSignature.ParameterAndReturnTypeEqualityComparer);
        }

        private bool TryGetPreviousMethodWithLessOptionalParameters(IList<MethodSignature> currentMethods, MethodSignature previousMethod, [NotNullWhen(true)] out MethodSignature? currentMethodToCall, [NotNullWhen(true)] out IReadOnlyList<Parameter>? missingParameters)
        {
            foreach (var item in currentMethods)
            {
                if (item.Parameters.Count <= previousMethod.Parameters.Count)
                {
                    continue;
                }

                if (!CurrentContainAllPreviousParameters(previousMethod, item))
                {
                    continue;
                }

                if (previousMethod.ReturnType is null && item.ReturnType is not null)
                {
                    continue;
                }

                // We can't use CsharpType.Equals here because they could have different implementations from different versions
                if (previousMethod.ReturnType is not null && !previousMethod.ReturnType.EqualsByName(item.ReturnType))
                {
                    continue;
                }

                var parameters = item.Parameters.Except(previousMethod.Parameters, Parameter.TypeAndNameEqualityComparer);
                if (parameters.All(x => x.IsOptionalInSignature))
                {
                    missingParameters = parameters.ToList();
                    currentMethodToCall = item;
                    return true;
                }
            }
            missingParameters = null;
            currentMethodToCall = null;
            return false;
        }

        private bool CurrentContainAllPreviousParameters(MethodSignature previousMethod, MethodSignature currentMethod)
        {
            var set = currentMethod.Parameters.ToHashSet(Parameter.TypeAndNameEqualityComparer);
            foreach (var parameter in previousMethod.Parameters)
            {
                if (!set.Contains(parameter))
                {
                    return false;
                }
            }
            return true;
        }

        private static MethodChangeset? CompareMethods(IEnumerable<MethodSignature> currentMethods, IEnumerable<MethodSignature>? previousMethods)
        {
            if (previousMethods is null)
            {
                return null;
            }
            var missing = new List<MethodSignature>();
            var updated = new List<(List<MethodSignature> Current, MethodSignature Previous)>();
            var set = currentMethods.ToHashSet(MethodSignature.ParameterAndReturnTypeEqualityComparer);
            var dict = new Dictionary<string, List<MethodSignature>>();
            foreach (var item in currentMethods)
            {
                if (!dict.TryGetValue(item.Name, out var list))
                {
                    dict.Add(item.Name, new List<MethodSignature> { item });
                }
                else
                {
                    list.Add(item);
                }
            }
            foreach (var item in previousMethods)
            {
                if (!set.Contains(item))
                {
                    if (dict.TryGetValue(item.Name, out var currentOverloadMethods))
                    {
                        updated.Add((currentOverloadMethods, item));
                    }
                    else
                    {
                        missing.Add(item);
                    }
                }
            }
            return new(missing, updated);
        }

        public IReadOnlyList<MethodSignature> Methods { get; }

        private IReadOnlyList<MethodSignature> PopulateMethodsFromCompilation(Compilation? compilation)
        {
            if (compilation is null)
            {
                return Array.Empty<MethodSignature>();
            }
            var type = compilation.GetTypeByMetadataName($"{_namespace}.{_name}");
            if (type is null)
            {
                return Array.Empty<MethodSignature>();
            }
            return PopulateMethods(type);
        }

        private IReadOnlyList<MethodSignature> PopulateMethods(INamedTypeSymbol? typeSymbol)
        {
            if (typeSymbol is null)
            {
                // TODO: handle missing type
                return Array.Empty<MethodSignature>();
            }
            var result = new List<MethodSignature>();
            var methods = typeSymbol.GetMembers().OfType<IMethodSymbol>();
            foreach (var method in methods)
            {
                var description = method.GetDocumentationCommentXml();
                if (!_typeFactory.TryCreateType(method.ReturnType, out var returnType))
                {
                    // TODO: handle missing method return type from MgmtOutputLibrary
                    continue;
                }

                // TODO: handle missing parameter type from MgmtOutputLibrary
                var parameters = new List<Parameter>();
                bool isParameterTypeMissing = false;
                foreach (var parameter in method.Parameters)
                {
                    var methodParameter = FromParameterSymbol(parameter);

                    // If any parameter can't be created, it means the type was removed from current version
                    if (methodParameter is null)
                    {
                        isParameterTypeMissing = true;
                        break;
                    }
                    else
                    {
                        parameters.Add(methodParameter);
                    }
                }

                // Since we don't have the ability to create the missing types, if any parameter type is missing we can't continue to generate overload methods
                if (isParameterTypeMissing)
                {
                    continue;
                }
                result.Add(new MethodSignature(method.Name, null, $"{description}", BuilderHelpers.MapModifiers(method), returnType, null, parameters, IsRawSummaryText: true));
            }
            return result;
        }

        private Parameter? FromParameterSymbol(IParameterSymbol parameterSymbol)
        {
            var parameterName = parameterSymbol.Name;
            if (_typeFactory.TryCreateType(parameterSymbol.Type, out var parameterType))
            {
                return new Parameter(parameterName, null, parameterType, null, ValidationType.None, null);
            }

            // If the parameter type can't be found from type factory, the type was removed from current version
            // Since we don't have the ability to create the missing types, we can't continue to generate overload methods
            return null;
        }
    }
}
