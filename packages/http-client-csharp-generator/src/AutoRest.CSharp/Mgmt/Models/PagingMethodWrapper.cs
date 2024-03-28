// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Mgmt.Models;

internal class PagingMethodWrapper
{
    public PagingMethodWrapper(PagingMethod pagingMethod)
    {
        Method = pagingMethod.Method;
        NextPageMethod = pagingMethod.NextPageMethod;
        NextLinkName = pagingMethod.PagingResponse.NextLinkPropertyName;
        ItemName = pagingMethod.PagingResponse.ItemPropertyName;
        ItemType = pagingMethod.PagingResponse.ItemType;
    }

    public PagingMethodWrapper(RestClientMethod method, CSharpType itemType, string valuePropertyName)
    {
        Method = method;
        NextPageMethod = null;
        NextLinkName = null;
        ItemName = valuePropertyName;
        ItemType = itemType;
    }

    public CSharpType ItemType { get; }

    /// <summary>
    /// This is the underlying <see cref="RestClientMethod"/> of this paging method
    /// </summary>
    public RestClientMethod Method { get; }

    /// <summary>
    /// This is the REST method for getting next page if there is one
    /// </summary>
    public RestClientMethod? NextPageMethod { get; }

    /// <summary>
    /// This is the property name in the response body, usually the value of this is `Value`
    /// </summary>
    public string ItemName { get; }

    /// <summary>
    /// This is the name of the nextLink property if there is one.
    /// </summary>
    public string? NextLinkName { get; }
}
