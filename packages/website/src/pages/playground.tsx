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
            title="TypeSpec Playground"
            src="https://cadlplayground.z22.web.core.windows.net"
            allow="clipboard-write"
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
