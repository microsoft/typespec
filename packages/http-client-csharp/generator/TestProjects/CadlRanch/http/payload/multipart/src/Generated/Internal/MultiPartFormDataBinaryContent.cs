#nullable disable

using System;
using System.ClientModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

namespace Payload.MultiPart;

internal partial class MultiPartFormDataBinaryContent : BinaryContent
{
    private readonly MultipartFormDataContent _multipartContent;

    private const int BoundaryLength = 70;
    private const string BoundaryValues = "0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

    public MultiPartFormDataBinaryContent()
    {
        _multipartContent = new MultipartFormDataContent(CreateBoundary());
    }

    public string ContentType
    {
        get
        {
            Debug.Assert(_multipartContent.Headers.ContentType is not null);

            return _multipartContent.Headers.ContentType!.ToString();
        }
    }

    internal HttpContent HttpContent => _multipartContent;

    // CUSTOM: Add optional content type parameter to the Add method.

    public void Add(Stream stream, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(stream, nameof(stream));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        StreamContent content = new(stream);
        if (contentType is not null)
        {
            content.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(content, name, fileName);
    }

    public void Add(string content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        StringContent stringContent = new(content);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }

        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(int content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(long content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(float content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(double content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(decimal content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(bool content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content ? "true" : "false";
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(byte[] content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));
        var byteArrayContent = new ByteArrayContent(content);
        if (contentType is not null)
        {
            byteArrayContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }

        Add(byteArrayContent, name, fileName);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(BinaryData content, string name, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        ByteArrayContent byteArrayContent = new(content.ToArray());
        if (contentType is not null)
        {
            byteArrayContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(byteArrayContent, name, fileName);
    }

    private void Add(HttpContent content, string name, string fileName)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNull(name, nameof(name));

        if (fileName is not null)
        {
            _multipartContent.Add(content, name, fileName);
        }
        else
        {
            _multipartContent.Add(content, name);
        }
    }

#if NET6_0_OR_GREATER
    private static string CreateBoundary() =>
        string.Create(BoundaryLength, 0, (chars, _) =>
        {
            Span<byte> random = stackalloc byte[BoundaryLength];
            Random.Shared.NextBytes(random);

            for (int i = 0; i < chars.Length; i++)
            {
                chars[i] = BoundaryValues[random[i] % BoundaryValues.Length];
            }
        });
#else
    private static readonly Random _random = new();

    private static string CreateBoundary()
    {
        Span<char> chars = stackalloc char[BoundaryLength];

        byte[] random = new byte[BoundaryLength];
        lock (_random)
        {
            _random.NextBytes(random);
        }

        // Instead of `% BoundaryValues.Length` as is used above, use a mask to achieve the same result.
        // `% BoundaryValues.Length` is optimized to the equivalent on .NET Core but not on .NET Framework.
        const int Mask = 255 >> 2;
        Debug.Assert(BoundaryValues.Length - 1 == Mask);

        for (int i = 0; i < chars.Length; i++)
        {
            chars[i] = BoundaryValues[random[i] & Mask];
        }

        return chars.ToString();
    }
#endif

    public override bool TryComputeLength(out long length)
    {
        // We can't call the protected method on HttpContent

        if (_multipartContent.Headers.ContentLength is long contentLength)
        {
            length = contentLength;
            return true;
        }

        length = 0;
        return false;
    }

    public override void WriteTo(Stream stream, CancellationToken cancellationToken = default)
    {
#if NET5_0_OR_GREATER
        _multipartContent.CopyTo(stream, default, cancellationToken);
#else
        // TODO: polyfill sync-over-async for netstandard2.0 for Azure clients.
        // Tracked by https://github.com/Azure/azure-sdk-for-net/issues/42674
        _multipartContent.CopyToAsync(stream).GetAwaiter().GetResult();
#endif
    }

    public override async Task WriteToAsync(Stream stream, CancellationToken cancellationToken = default)
    {
#if NET5_0_OR_GREATER
        await _multipartContent.CopyToAsync(stream, cancellationToken).ConfigureAwait(false);
#else
        await _multipartContent.CopyToAsync(stream).ConfigureAwait(false);
#endif
    }

    public override void Dispose()
    {
        _multipartContent.Dispose();
    }
}
