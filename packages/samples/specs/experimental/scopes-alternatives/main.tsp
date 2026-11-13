import "@typespec/http";
import "@typespec/versioning";
using Http;
using Versioning;

/**
 * Alternatives pick exactly one shape per scope. Open the "Scope views" output
 * and switch between versions to see `settings` change type and `getWidget`
 * change template, without @added/@removed/@renamedFrom.
 */
@service
@versioned(Versions)
namespace Widgets;

enum Versions {
  v1,
  v2,
  v3,
}

model Settings {
  enabled: boolean;
}

model Widget {
  @key id: string;

  // Changes type in v2: no removed/added/renamed property pair.
  settings: when {
    before(Versions.v2) => string,
    else => Settings,
  };

  // No `else`: the property is absent outside v1.
  legacyCode: when {
    Versions.v1 => int32,
  };
}

op ReadV1<T>(@path id: string): T;
op ReadV2<T>(@path id: string, @query expand?: boolean): T;

// The operation switches its `is` template. Branches may overlap: in v3 both
// `since(v2)` and `Versions.v3` match, and the more specific one wins.
@route("/widgets/{id}")
@get
op getWidget when {
  before(Versions.v2) => is ReadV1<Widget>,
  since(Versions.v2) => is ReadV2<Widget>,
  Versions.v3 => (@path id: string, @query expand?: boolean, @query filter?: string): Widget,
};
