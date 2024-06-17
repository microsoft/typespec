// <auto-generated/>

#nullable disable

using System;
using UnbrandedTypeSpec.Models;

namespace UnbrandedTypeSpec
{
    public partial class UnbrandedTypeSpecClient
    {
        /// <summary> Return hi. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="headParameter"></param>
        /// <param name="queryParameter"></param>
        /// <param name="optionalQuery"></param>
        /// <param name="accept"></param>
        internal void CreateSayHiRequest(System.Uri unbrandedTypeSpecUrl, string headParameter, string queryParameter, string optionalQuery, string accept)
        {
        }

        /// <summary> Return hi again. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="p1"></param>
        /// <param name="contentType"></param>
        /// <param name="p2"></param>
        /// <param name="action"></param>
        /// <param name="accept"></param>
        internal void CreateHelloAgainRequest(System.Uri unbrandedTypeSpecUrl, string p1, string contentType, string p2, RoundTripModel action, string accept)
        {
        }

        /// <summary> Return hi again. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="p1"></param>
        /// <param name="p2"></param>
        /// <param name="action"></param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateNoContentTypeRequest(System.Uri unbrandedTypeSpecUrl, string p1, string p2, RoundTripModel action, string accept, string contentType)
        {
        }

        /// <summary> Return hi in demo2. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="accept"></param>
        internal void CreateHelloDemo2Request(System.Uri unbrandedTypeSpecUrl, string accept)
        {
        }

        /// <summary> Create with literal value. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="body"></param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateCreateLiteralRequest(System.Uri unbrandedTypeSpecUrl, Thing body, string accept, string contentType)
        {
        }

        /// <summary> Send literal parameters. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="p1"></param>
        /// <param name="p2"></param>
        /// <param name="p3"></param>
        /// <param name="accept"></param>
        internal void CreateHelloLiteralRequest(System.Uri unbrandedTypeSpecUrl, string p1, int p2, bool p3, string accept)
        {
        }

        /// <summary> top level method. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="action"></param>
        /// <param name="accept"></param>
        internal void CreateTopActionRequest(System.Uri unbrandedTypeSpecUrl, DateTimeOffset action, string accept)
        {
        }

        /// <summary> top level method2. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="accept"></param>
        internal void CreateTopAction2Request(System.Uri unbrandedTypeSpecUrl, string accept)
        {
        }

        /// <summary> top level patch. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="body"></param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreatePatchActionRequest(System.Uri unbrandedTypeSpecUrl, Thing body, string accept, string contentType)
        {
        }

        /// <summary> body parameter without body decorator. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="Thing"> A model with a few properties of literal types. </param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateAnonymousBodyRequest(System.Uri unbrandedTypeSpecUrl, Thing Thing, string accept, string contentType)
        {
        }

        /// <summary> Model can have its friendly name. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="Friend"> this is not a friendly model but with a friendly name. </param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateFriendlyModelRequest(System.Uri unbrandedTypeSpecUrl, Friend Friend, string accept, string contentType)
        {
        }

        /// <summary> addTimeHeader. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="repeatabilityFirstSent"></param>
        /// <param name="accept"></param>
        internal void CreateAddTimeHeaderRequest(System.Uri unbrandedTypeSpecUrl, DateTimeOffset repeatabilityFirstSent, string accept)
        {
        }

        /// <summary> Model can have its projected name. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="ProjectedModel"> this is a model with a projected name. </param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateProjectedNameModelRequest(System.Uri unbrandedTypeSpecUrl, ProjectedModel ProjectedModel, string accept, string contentType)
        {
        }

        /// <summary> return anonymous model. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="accept"></param>
        internal void CreateReturnsAnonymousModelRequest(System.Uri unbrandedTypeSpecUrl, string accept)
        {
        }

        /// <summary> get extensible enum. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="accept"></param>
        internal void CreateGetUnknownValueRequest(System.Uri unbrandedTypeSpecUrl, string accept)
        {
        }

        /// <summary> When set protocol false and convenient true, then the protocol method should be internal. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="body"></param>
        /// <param name="accept"></param>
        /// <param name="contentType"></param>
        internal void CreateInternalProtocolRequest(System.Uri unbrandedTypeSpecUrl, Thing body, string accept, string contentType)
        {
        }

        /// <summary> When set protocol false and convenient true, the convenient method should be generated even it has the same signature as protocol one. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="accept"></param>
        internal void CreateStillConvenientRequest(System.Uri unbrandedTypeSpecUrl, string accept)
        {
        }

        /// <summary> head as boolean. </summary>
        /// <param name="unbrandedTypeSpecUrl"></param>
        /// <param name="id"></param>
        /// <param name="accept"></param>
        internal void CreateHeadAsBooleanRequest(System.Uri unbrandedTypeSpecUrl, string id, string accept)
        {
        }
    }
}
