import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";

export default function Playground() {
  return (
    <Layout>
      <div
        className="play-iframe"
        style={{
          display: "flex",
          position: "absolute",
          width: "100%",
          height: "80%",
        }}
      >
        {
          <iframe
            title="Cadl Specification"
            src={useBaseUrl("/spec.html")}
            style={{
              height: "100%",
              width: "100%",
            }}
          ></iframe>
        }
      </div>
    </Layout>
  );
}
