public override async global::System.Threading.Tasks.Task WriteToAsync(global::System.IO.Stream stream, global::System.Threading.CancellationToken cancellationToken = default(global::System.Threading.CancellationToken))
{
    bool first = true;
    await foreach (T value in _values.WithCancellation(cancellationToken))
    {
        if (!first)
        {
            await stream.WriteAsync(_newLine, 0, 1, cancellationToken).ConfigureAwait(false);
        }
        using (global::System.Text.Json.Utf8JsonWriter writer = new global::System.Text.Json.Utf8JsonWriter(stream))
        {
            writer.WriteObjectValue<T>(value, _options);
            await writer.FlushAsync(cancellationToken).ConfigureAwait(false);
        }
        first = false;
    }
}
