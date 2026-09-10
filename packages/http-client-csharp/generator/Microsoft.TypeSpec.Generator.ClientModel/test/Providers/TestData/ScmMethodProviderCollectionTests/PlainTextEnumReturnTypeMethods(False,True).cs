public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum> GetPlainTextEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextEnum(cancellationToken.ToRequestOptions());
    global::Sample.Models.TestEnum value = new global::Sample.Models.TestEnum(int.Parse(result.GetRawResponse().Content.ToString().TrimStart('﻿'), global::System.Globalization.CultureInfo.InvariantCulture));
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
