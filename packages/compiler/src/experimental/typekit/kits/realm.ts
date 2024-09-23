import { Realm } from "../../realm.js";
import { defineKit } from "../define-kit.js";

/** @experimental */
export interface RealmKit {
  /**
   * Gets the current realm used by the typekit.
   */
  get(): Realm;
  /**
   * Sets the current realm to be used by the typekit.
   */
  set(realm: Realm): void;
}

interface BaseTypeKit {
  /**
   * Utilities for working with general types.
   */
  realm: RealmKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends BaseTypeKit {}
}

let _realm: Realm;

defineKit<BaseTypeKit>({
  realm: {
    get() {
      if (!_realm) {
        _realm = new Realm(this.program, " typekit realm");
      }

      return _realm;
    },
    set(realm: Realm) {
      _realm = realm;
    },
  },
});
