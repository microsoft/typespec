// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure.ResourceManager;
using Azure.ResourceManager.ManagementGroups;
using Azure.ResourceManager.Resources;

namespace AutoRest.CSharp.Mgmt.Models;

/// <summary>
/// A <see cref="RequestPath"/> represents a parsed request path in the swagger which corresponds to an operation. For instance, `/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines`
/// </summary>
internal readonly struct RequestPath : IEquatable<RequestPath>, IReadOnlyList<Segment>
{
    private const string _providerPath = "/subscriptions/{subscriptionId}/providers/{resourceProviderNamespace}";
    private const string _featurePath = "/subscriptions/{subscriptionId}/providers/Microsoft.Features/providers/{resourceProviderNamespace}/features";

    internal const string ManagementGroupScopePrefix = "/providers/Microsoft.Management/managementGroups";
    internal const string ResourceGroupScopePrefix = "/subscriptions/{subscriptionId}/resourceGroups";
    internal const string SubscriptionScopePrefix = "/subscriptions";
    internal const string TenantScopePrefix = "/tenants";

    public static readonly RequestPath Empty = new(Array.Empty<Segment>());

    public static readonly RequestPath Null = new(new[] { new Segment("") });

    /// <summary>
    /// This is a placeholder of request path for "any" resources in other RPs
    /// </summary>
    public static readonly RequestPath Any = new(new[] { new Segment("*") });

    /// <summary>
    /// The <see cref="RequestPath"/> of a resource group resource
    /// </summary>
    public static readonly RequestPath ResourceGroup = new(new[] {
        new Segment("subscriptions"),
        new Segment(new Reference("subscriptionId", typeof(string)), true, true),
        new Segment("resourceGroups"),
        new Segment(new Reference("resourceGroupName", typeof(string)), true, false)
    });

    /// <summary>
    /// The <see cref="RequestPath"/> of a subscription resource
    /// </summary>
    public static readonly RequestPath Subscription = new(new[] {
        new Segment("subscriptions"),
        new Segment(new Reference("subscriptionId", typeof(string)), true, true)
    });

    /// <summary>
    /// The <see cref="RequestPath"/> of tenants
    /// </summary>
    public static readonly RequestPath Tenant = new(Enumerable.Empty<Segment>());

    /// <summary>
    /// The <see cref="RequestPath"/> of a management group resource
    /// </summary>
    public static readonly RequestPath ManagementGroup = new(new[] {
        new Segment("providers"),
        new Segment("Microsoft.Management"),
        new Segment("managementGroups"),
        // We use strict = false because we usually see the name of management group is different in different RPs. Some of them are groupId, some of them are groupName, etc
        new Segment(new Reference("managementGroupId", typeof(string)), true, false)
    });

    private static Dictionary<Type, RequestPath>? _extensionChoices;
    public static Dictionary<Type, RequestPath> ExtensionChoices => _extensionChoices ??= new()
    {
        [typeof(TenantResource)] = RequestPath.Tenant,
        [typeof(ManagementGroupResource)] = RequestPath.ManagementGroup,
        [typeof(SubscriptionResource)] = RequestPath.Subscription,
        [typeof(ResourceGroupResource)] = RequestPath.ResourceGroup,
    };

    public static RequestPath GetContextualPath(Type armCoreType)
    {
        return ExtensionChoices[armCoreType];
    }

    private readonly IReadOnlyList<Segment> _segments;

    public static RequestPath FromString(string rawPath)
    {
        var rawSegments = rawPath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        var segments = rawSegments.Select(raw => GetSegmentFromString(raw));

        return new RequestPath(segments);
    }

    public static RequestPath FromSegments(IEnumerable<Segment> segments) => new RequestPath(segments);

    public static RequestPath FromOperation(Operation operation, OperationGroup operationGroup)
    {
        foreach (var request in operation.Requests)
        {
            var httpRequest = request.Protocol.Http as HttpRequest;
            if (httpRequest is null)
                continue;

            var references = new MgmtRestClientBuilder(operationGroup).GetReferencesToOperationParameters(operation, request.Parameters);
            var segments = new List<Segment>();
            var segmentIndex = 0;
            CreateSegments(httpRequest.Uri, references, segments, ref segmentIndex);
            CreateSegments(httpRequest.Path, references, segments, ref segmentIndex);

            return new RequestPath(CheckByIdPath(segments), operation.GetHttpPath());
        }

        throw new ErrorHelpers.ErrorException($"We didn't find request path for {operationGroup.Key}.{operation.CSharpName()}");
    }

    private static Segment GetSegmentFromString(string str)
    {
        var trimmed = TrimRawSegment(str);
        var isScope = trimmed == "scope";
        return new Segment(trimmed, escape: !isScope, isConstant: !isScope && !str.Contains('{'));
    }

    private static string TrimRawSegment(string segment) => segment.TrimStart('{').TrimEnd('}');

    public int IndexOfLastProviders { get; }

    private RequestPath(IReadOnlyList<Segment> segments, string httpPath)
    {
        _segments = segments;
        SerializedPath = httpPath;
        IsExpandable = GetIsExpandable(segments);
        IndexOfLastProviders = _segments.ToList().LastIndexOf(Segment.Providers);
    }

    private static bool GetIsExpandable(IEnumerable<Segment> segments)
        => segments
            .Where((s, i) => i % 2 == 0 && s.IsReference && !s.Reference.Type.IsFrameworkType && s.Reference.Type.Implementation is EnumType)
            .Any();

    private static IReadOnlyList<Segment> CheckByIdPath(IReadOnlyList<Segment> segments)
    {
        // if this is a byId request path, we need to make it strict, since it might be accidentally to be any scope request path's parent
        if (segments.Count != 1)
            return segments;
        var first = segments.First();
        if (first.IsConstant)
            return segments;
        if (!first.SkipUrlEncoding)
            return segments;

        // this is a ById request path
        return new List<Segment> { new Segment(first.Reference, first.Escape, true) };
    }

    public bool IsById => Count == 1 && this.First().SkipUrlEncoding;

    /// <summary>
    /// Constructs the <see cref="RequestPath"/> instance using a collection of <see cref="Segment"/>
    /// This is used for the request path that does not come from the swagger document, or an incomplete request path
    /// </summary>
    /// <param name="segments"></param>
    private RequestPath(IEnumerable<Segment> segments) : this(segments.ToArray(), Segment.BuildSerializedSegments(segments))
    {
    }

    /// <summary>
    /// The raw request path of this <see cref="RequestPath"/> instance
    /// </summary>
    public string SerializedPath { get; }

    public bool IsExpandable { get; }

    /// <summary>
    /// Check if this <see cref="RequestPath"/> is a prefix path of <code other/>
    /// Note that this.IsAncestorOf(this) will return false which indicates that this method is testing the "proper ancestor" like a proper subset.
    /// </summary>
    /// <param name="other"></param>
    /// <returns></returns>
    public bool IsAncestorOf(RequestPath other)
    {
        // To be the parent of other, you must at least be shorter than other.
        if (other.Count <= Count)
            return false;
        for (int i = 0; i < Count; i++)
        {
            // we need the segment to be identical when strict is true (which is the default value)
            // when strict is false, we also need the segment to be identical if it is constant.
            // but if it is a reference, we only require they have the same type, do not require they have the same variable name.
            // This case happens a lot during the management group parent detection - different RP calls this different things
            if (!this[i].Equals(other[i]))
                return false;
        }
        return true;
    }

    /// <summary>
    /// Check if <paramref name="requestPath"/> is a prefix path of <paramref name="candidate"/>
    /// While comparing, we will ignore everything inside {}
    /// For instance, if "/subs/{subsId}/rgs/{name}/foo" and "/subs/{subsId}/rgs/{name}/foo/bar/{something}",
    /// we are effectively comparing /subs/{}/rgs/{}/foo and /subs/{}/rgs/{}/foo/bar/{}
    /// </summary>
    /// <param name="requestPath"></param>
    /// <param name="candidate"></param>
    /// <returns></returns>
    public static bool IsPrefix(string requestPath, string candidate)
    {
        // Create spans for the candidate and request path
        ReadOnlySpan<char> candidateSpan = candidate.AsSpan();
        ReadOnlySpan<char> requestPathSpan = requestPath.AsSpan();

        int cIdx = 0, rIdx = 0;

        // iterate through everything on request path
        while (rIdx < requestPathSpan.Length)
        {
            // if we run out of candidate, return false because request path here is effectively longer than candidate
            if (cIdx >= candidateSpan.Length)
                return false;

            // if we hit a {
            char c = candidateSpan[cIdx];
            char r = requestPathSpan[rIdx];

            if (c != r)
                return false;

            if (c == '{')
            {
                // they both are {, skip everything until we have a } or we get to the last character of the string
                while (cIdx < candidateSpan.Length - 1 && candidateSpan[cIdx] != '}')
                    cIdx++;
                while (rIdx < requestPathSpan.Length - 1 && requestPathSpan[rIdx] != '}')
                    rIdx++;
            }
            else
            {
                // they are the same but not {
                cIdx++;
                rIdx++;
            }
        }

        return true;
    }

    /// <summary>
    /// Trim this from the other and return the <see cref="RequestPath"/> that remain.
    /// The result is "other - this" by removing this as a prefix of other.
    /// If this == other, return empty request path
    /// </summary>
    /// <param name="other"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException">if this.IsAncestorOf(other) is false</exception>
    public RequestPath TrimAncestorFrom(RequestPath other)
    {
        if (TryTrimAncestorFrom(other, out var diff))
            return diff;

        throw new InvalidOperationException($"Request path {this} is not parent of {other}");
    }

    public bool TryTrimAncestorFrom(RequestPath other, [MaybeNullWhen(false)] out RequestPath diff)
    {
        diff = default;
        if (this == other)
        {
            diff = RequestPath.Tenant;
            return true;
        }
        if (this.IsAncestorOf(other))
        {
            diff = new RequestPath(other._segments.Skip(this.Count));
            return true;
        }
        // Handle the special case of trim provider from feature
        else if (this.SerializedPath == _providerPath && other.SerializedPath.StartsWith(_featurePath))
        {
            diff = new RequestPath(other._segments.Skip(this.Count + 2));
            return true;
        }
        return false;
    }

    /// <summary>
    /// Trim the scope out of this request path.
    /// If this is already a scope path, return the empty request path, aka the RequestPath.Tenant
    /// </summary>
    /// <returns></returns>
    public RequestPath TrimScope()
    {
        var scope = this.GetScopePath();
        // The scope for /subscriptions is /subscriptions/{subscriptionId}, we identify such case with scope.Count > this.Count.
        if (scope == this || scope.Count > this.Count)
            return Tenant; // if myself is a scope path, we return the empty path after the trim.
        return scope.TrimAncestorFrom(this);
    }

    public RequestPath Append(RequestPath other)
    {
        return new RequestPath(this._segments.Concat(other._segments));
    }

    public RequestPath ApplyHint(ResourceTypeSegment hint)
    {
        if (hint.Count == 0)
            return this;
        int hintIndex = 0;
        List<Segment> newPath = new List<Segment>();
        int thisIndex = 0;
        for (; thisIndex < _segments.Count; thisIndex++)
        {
            var segment = this[thisIndex];
            if (segment.IsExpandable)
            {
                newPath.Add(hint[hintIndex]);
                hintIndex++;
            }
            else
            {
                if (segment.Equals(hint[hintIndex]))
                {
                    hintIndex++;
                }
                newPath.Add(segment);
            }
            if (hintIndex >= hint.Count)
            {
                thisIndex++;
                break;
            }
        }

        //copy remaining items in this
        for (; thisIndex < _segments.Count; thisIndex++)
        {
            newPath.Add(_segments[thisIndex]);
        }
        return new RequestPath(newPath);
    }

    public IEnumerable<RequestPath> Expand()
    {
        // we first get the resource type
        var resourceType = this.GetResourceType();

        // if this resource type is a constant, we do not need to expand it
        if (resourceType.IsConstant)
            return this.AsIEnumerable();

        // otherwise we need to expand them (the resource type is not a constant)
        // first we get all the segment that is not a constant
        var possibleValueMap = new Dictionary<Segment, IEnumerable<Segment>>();
        foreach (var segment in resourceType.Where(segment => segment.IsReference && !segment.Reference.Type.IsFrameworkType))
        {
            var type = segment.Reference.Type.Implementation;
            switch (type)
            {
                case EnumType enumType:
                    possibleValueMap.Add(segment, enumType.Values.Select(v => new Segment(v.Value, segment.Escape, segment.IsStrict, enumType.Type)));
                    break;
                default:
                    throw new InvalidOperationException($"The resource type {this} contains variables in it, but it is not an enum type, therefore we cannot expand it. Please double check and/or override it in `request-path-to-resource-type` section.");
            }
        }

        // construct new resource types to make the resource types constant again
        // here we are traversing the segments in this resource type as a tree:
        // if the segment is constant, just add it into the result
        // if the segment is not a constant, we need to add its all possible values (they are all constants) into the result
        // first we build the levels
        var levels = this.Select(segment => segment.IsConstant || !possibleValueMap.ContainsKey(segment) ?
            segment.AsIEnumerable() :
            possibleValueMap[segment]);
        // now we traverse the tree to get the result
        var queue = new Queue<List<Segment>>();
        foreach (var level in levels)
        {
            // initialize
            if (queue.Count == 0)
            {
                foreach (var _ in level)
                    queue.Enqueue(new List<Segment>());
            }
            // get every element in queue out, and push the new results back
            int count = queue.Count;
            for (int i = 0; i < count; i++)
            {
                var list = queue.Dequeue();
                foreach (var segment in level)
                {
                    // push the results back with a new element on it
                    queue.Enqueue(new List<Segment>(list) { segment });
                }
            }
        }

        return queue.Select(list => new RequestPath(list));
    }

    private static ISet<ResourceTypeSegment> GetScopeResourceTypes(RequestPath requestPath)
    {
        var scope = requestPath.GetScopePath();
        if (scope.IsParameterizedScope())
        {
            return new HashSet<ResourceTypeSegment>(requestPath.GetParameterizedScopeResourceTypes()!);
        }

        return new HashSet<ResourceTypeSegment> { scope.GetResourceType() };
    }

    /// <summary>
    /// Return true if the scope resource types of the first path are a subset of the second path
    /// </summary>
    /// <param name="requestPath"></param>
    /// <param name="resourcePath"></param>
    /// <returns></returns>
    public static bool IsScopeCompatible(RequestPath requestPath, RequestPath resourcePath)
    {
        // get scope types
        var requestScopeTypes = GetScopeResourceTypes(requestPath);
        var resourceScopeTypes = GetScopeResourceTypes(resourcePath);
        if (resourceScopeTypes.Contains(ResourceTypeSegment.Any))
            return true;
        return requestScopeTypes.IsSubsetOf(resourceScopeTypes);
    }

    private static void CreateSegments(string path, IReadOnlyDictionary<string, (ReferenceOrConstant ReferenceOrConstant, bool SkipUrlEncoding)> references, ICollection<Segment> segments, ref int segmentIndex)
    {
        foreach ((ReadOnlySpan<char> span, bool isLiteral) in Utilities.StringExtensions.GetPathParts(path))
        {
            if (isLiteral)
            {
                // in this case, we have a constant in this path segment, which might contains slashes
                // we need to split it into real segments
                // For instance we might get "/providers/Microsoft.Storage/blobServices/default" here
                // we will never get null in this constant since it comes from request path
                var literalSpan = span;
                while (!literalSpan.IsEmpty)
                {
                    var separatorIndex = literalSpan.IndexOf('/');
                    if (separatorIndex > 0)
                    {
                        segmentIndex++;
                        segments.Add(new Segment(literalSpan[..separatorIndex].ToString()));
                    }

                    if (separatorIndex < 0)
                    {
                        segments.Add(new Segment(literalSpan.ToString()));
                        break;
                    }

                    literalSpan = literalSpan[(separatorIndex + 1)..];
                }
            }
            else
            {
                if (references.TryGetValue(span.ToString(), out var parameterReference))
                {
                    segmentIndex++;
                    var (referenceOrConstant, skipUriEncoding) = parameterReference;
                    var valueType = referenceOrConstant.Type;

                    // we explicitly skip the `uri` variable in the path (which should be `endpoint`)
                    if (valueType.Equals(typeof(Uri)))
                    {
                        continue;
                    }

                    //for now we only assume expand variables are in the key slot which will be an odd slot
                    CSharpType? expandableType = segmentIndex % 2 == 0 && !valueType.IsFrameworkType && valueType.Implementation is EnumType ? valueType : null;

                    // this is either a constant but not string type, or it is not a constant, we just keep the information in this path segment
                    segments.Add(new Segment(referenceOrConstant, !skipUriEncoding, expandableType: expandableType));
                }
                else
                {
                    ErrorHelpers.ThrowError($"\n\nError while processing request '{path}'\n\n  '{span.ToString()}' in URI is missing a matching definition in the path parameters collection{ErrorHelpers.UpdateSwaggerOrFile}");
                }
            }
        }
    }

    public int Count => _segments.Count;

    public Segment this[int index] => _segments[index];

    public bool Equals(RequestPath other)
    {
        if (Count != other.Count)
            return false;
        for (int i = 0; i < Count; i++)
        {
            if (!this[i].Equals(other[i]))
                return false;
        }
        return true;
    }

    public override bool Equals(object? obj) => obj is RequestPath other && Equals(other);

    public IEnumerator<Segment> GetEnumerator() => _segments.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => _segments.GetEnumerator();

    public override int GetHashCode() => SerializedPath.GetHashCode();

    public override string ToString() => SerializedPath;

    public static bool operator ==(RequestPath left, RequestPath right)
    {
        return left.Equals(right);
    }

    public static bool operator !=(RequestPath left, RequestPath right)
    {
        return !(left == right);
    }

    public static implicit operator string(RequestPath requestPath)
    {
        return requestPath.SerializedPath;
    }
}
