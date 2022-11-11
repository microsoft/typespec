import Layout from "@theme/Layout";

export default function Playground() {
  return (
    <Layout title="Playground" description="Cadl Playground Page">
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
            title="Cadl Playground"
            src="https://cadlplayground.z22.web.core.windows.net"
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
