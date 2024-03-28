// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using Azure.Core;

namespace AutoRest.CSharp.Mgmt.Output;

/// <summary>
/// A virtual resource stands for a resource from another SDK, and it plays a role of anchor of some operations that belong to this resource in another SDK
/// </summary>
internal class PartialResource : Resource
{
    protected internal PartialResource(OperationSet operationSet, IEnumerable<Operation> operations, string defaultName, string originalResourceName, ResourceTypeSegment resourceType, EmptyResourceData resourceData) : base(operationSet, operations, defaultName, resourceType, resourceData, ResourcePosition)
    {
        OriginalResourceName = originalResourceName;
    }

    /// <summary>
    /// This is the resource name of its original resource, the resource that this partial resource is extending
    /// </summary>
    public string OriginalResourceName { get; }

    protected override FormattableString CreateDescription()
    {
        var an = ResourceName.StartsWithVowel() ? "an" : "a";
        List<FormattableString> lines = new List<FormattableString>();

        lines.Add($"A class extending from the {OriginalResourceName.AddResourceSuffixToResourceName()} in {MgmtContext.DefaultNamespace} along with the instance operations that can be performed on it.");
        lines.Add($"You can only construct {an} {Type:C} from a {typeof(ResourceIdentifier):C} with a resource type of {ResourceType}.");

        return FormattableStringHelpers.Join(lines, "\r\n");
    }

    protected override ConstructorSignature? EnsureResourceDataCtor()
    {
        // virtual resource does not have this constructor
        return null;
    }

    protected override Method BuildCreateResourceIdentifierMethod()
    {
        var original = base.BuildCreateResourceIdentifierMethod();

        return new(
            original.Signature with
            {
                Modifiers = MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static
            }, original.Body!);
    }

    protected override IEnumerable<FieldDeclaration> GetAdditionalFields()
    {
        yield break;
    }
}
