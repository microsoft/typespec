// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Authentication.ApiKey
{
    internal partial class ClientUriBuilder
    {
        private UriBuilder _uriBuilder;
        private StringBuilder _pathBuilder;
        private StringBuilder _queryBuilder;

        public ClientUriBuilder()
        {
        }

        private UriBuilder UriBuilder => _uriBuilder  ??=  new UriBuilder();

        private StringBuilder PathBuilder => _pathBuilder  ??=  new StringBuilder(UriBuilder.Path);

        private StringBuilder QueryBuilder => _queryBuilder  ??=  new StringBuilder(UriBuilder.Query);

        public void Reset(Uri uri)
        {
            _uriBuilder = new UriBuilder(uri);
            _pathBuilder = new StringBuilder(UriBuilder.Path);
            _queryBuilder = new StringBuilder(UriBuilder.Query);
        }

        public void AppendPath(string value, bool escape)
        {
            if (escape)
            {
                value = Uri.EscapeDataString(value);
            }
            if (PathBuilder.Length > 0 && PathBuilder[PathBuilder.Length - 1] == '/' && value[0] == '/')
            {
                PathBuilder.Remove(PathBuilder.Length - 1, 1);
            }
            PathBuilder.Append(value);
            UriBuilder.Path = PathBuilder.ToString();
        }

        public void AppendPath(bool value, bool escape = false) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPath(float value, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPath(double value, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPath(int value, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPath(byte[] value, string format, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value, format), escape);

        public void AppendPath(DateTimeOffset value, string format, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value, format), escape);

        public void AppendPath(TimeSpan value, string format, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value, format), escape);

        public void AppendPath(Guid value, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPath(long value, bool escape = true) => AppendPath(TypeFormatters.ConvertToString(value), escape);

        public void AppendPathDelimited<T>(IEnumerable<T> value, string delimiter, string format = null, bool escape = true)
        {
            delimiter ??= ",";
            IEnumerable<string> stringValues = value.Select(v => TypeFormatters.ConvertToString(v, format));
            AppendPath(string.Join(delimiter, stringValues), escape);
        }

        public void AppendQuery(string name, string value, bool escape)
        {
            if (QueryBuilder.Length > 0)
            {
                QueryBuilder.Append('&');
            }
            if (escape)
            {
                value = Uri.EscapeDataString(value);
            }
            QueryBuilder.Append(name);
            QueryBuilder.Append('=');
            QueryBuilder.Append(value);
        }

        public void AppendQuery(string name, bool value, bool escape = false) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, float value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, DateTimeOffset value, string format, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value, format), escape);

        public void AppendQuery(string name, TimeSpan value, string format, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value, format), escape);

        public void AppendQuery(string name, double value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, decimal value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, int value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, long value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, TimeSpan value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQuery(string name, byte[] value, string format, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value, format), escape);

        public void AppendQuery(string name, Guid value, bool escape = true) => AppendQuery(name, TypeFormatters.ConvertToString(value), escape);

        public void AppendQueryDelimited<T>(string name, IEnumerable<T> value, string delimiter, string format = null, bool escape = true)
        {
            delimiter ??= ",";
            IEnumerable<string> stringValues = value.Select(v => TypeFormatters.ConvertToString(v, format));
            AppendQuery(name, string.Join(delimiter, stringValues), escape);
        }

        public Uri ToUri()
        {
            if (_pathBuilder != null)
            {
                UriBuilder.Path = _pathBuilder.ToString();
            }
            if (_queryBuilder != null)
            {
                UriBuilder.Query = _queryBuilder.ToString();
            }
            return UriBuilder.Uri;
        }
    }
}
