import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import style from "./packages.module.css";

interface NpmPackage {
  name: string;
  description: string;
  version: string;
  publisherUsername: string;
  publisherEmail: string;
  date: string;
  link: string;
  keywords: string[];
}

interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      description?: string;
      version: string;
      author?: { name?: string };
      publisher?: { username?: string; email?: string };
      date: string;
      keywords?: string[];
      links: { npm?: string };
    };
  }>;
  total: number;
}

async function fetchNpmPackages(): Promise<NpmPackage[]> {
  const response = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=keywords:typespec&size=250",
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch packages: ${response.statusText}`);
  }
  const data: NpmSearchResult = await response.json();
  return data.objects.map((obj) => ({
    name: obj.package.name,
    description: obj.package.description ?? "",
    version: obj.package.version,
    publisherUsername: obj.package.publisher?.username ?? "unknown",
    publisherEmail: obj.package.publisher?.email ?? "",
    date: obj.package.date,
    link: obj.package.links.npm ?? `https://www.npmjs.com/package/${obj.package.name}`,
    keywords: obj.package.keywords ?? [],
  }));
}

async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  // Gravatar also accepts SHA-256 hashes
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function PackageCard({ pkg }: { pkg: NpmPackage }) {
  const timeAgo = formatDistanceToNow(new Date(pkg.date), { addSuffix: true });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pkg.publisherEmail) {
      md5(pkg.publisherEmail.trim().toLowerCase()).then((hash) => {
        setAvatarUrl(`https://www.gravatar.com/avatar/${hash}?s=72&d=retro`);
      });
    }
  }, [pkg.publisherEmail]);

  return (
    <li className={style["package-item"]}>
      <a
        href={pkg.link}
        target="_blank"
        rel="noopener noreferrer"
        className={style["card-link"]}
      >
        <div className={style["card"]}>
          <div className={style["card-bg"]} />
          <div className={style["card-content"]}>
            <div className={style["card-header"]}>
              <div className={style["card-title-row"]}>
                <span className={style["package-name"]}>{pkg.name}</span>
                <span className={style["version-badge"]}>v{pkg.version}</span>
              </div>
            </div>
            {pkg.description && <p className={style["description"]}>{pkg.description}</p>}
            {pkg.keywords.length > 0 && (
              <div className={style["keywords"]}>
                {pkg.keywords.map((kw) => (
                  <span key={kw} className={style["keyword"]}>
                    {kw}
                  </span>
                ))}
              </div>
            )}
            <div className={style["meta"]}>
              {avatarUrl && (
                <img src={avatarUrl} alt="" className={style["avatar"]} loading="lazy" />
              )}
              <span>{pkg.publisherUsername}</span>
              <span>·</span>
              <span>updated {timeAgo}</span>
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}

export const PackageList = () => {
  const [packages, setPackages] = useState<NpmPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    fetchNpmPackages()
      .then(setPackages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return packages;
    const lowerFilter = filter.toLowerCase();
    return packages.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerFilter) ||
        p.description.toLowerCase().includes(lowerFilter),
    );
  }, [packages, filter]);

  return (
    <div className={style["content"]}>
      <section className={style["intro"]}>
        <h1>TypeSpec Packages</h1>
        <p>
          Packages on npm tagged with the <code>typespec</code> keyword.
        </p>
      </section>
      <section className={style["list"]}>
        <input
          type="text"
          placeholder="Filter packages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={style["search-input"]}
        />
        {loading && <div className={style["loading"]}>Loading packages...</div>}
        {error && (
          <div className={style["error"]}>
            <p>Failed to load packages: {error}</p>
            <button onClick={load} className={style["retry-button"]}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className={style["count"]}>
              {filtered.length} package{filtered.length !== 1 ? "s" : ""} found
            </div>
            <ul className={style["package-grid"]}>
              {filtered.map((pkg) => (
                <PackageCard key={pkg.name} pkg={pkg} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};
