import { hcWithType } from "@doxynix/siem-server/client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const client = hcWithType(SERVER_URL);

function Index() {
  const {
    mutate: sendRequest,
    data,
    isPending,
  } = useMutation({
    mutationFn: async () => {
      try {
        const res = await client.api.logs.scan.$post({
          json: {
            content:
              "Привет! Это лог для проверки.\nА тут лежит уязвимость: 1234-5678-9012-3456\nИ еще одна безопасная строка.",
          },
        });
        return await res.json();
      } catch (error) {
        throw new Error(`Error fetching data:${error}`);
      }
    },
  });

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
      {isPending && (
        <div className="animate-spin size-7 border border-b-0 bg-transparent rounded-full" />
      )}

      <h1 className="text-5xl font-black">bhvr</h1>
      <h2 className="text-2xl font-bold">Bun + Hono + Vite + React</h2>
      <p>A typesafe fullstack monorepo</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => sendRequest()}
          className="bg-black text-white px-2.5 py-1.5 rounded-md"
        >
          Call API
        </button>
        <a
          target="_blank"
          href="https://bhvr.dev"
          className="border border-black text-black px-2.5 py-1.5 rounded-md"
          rel="noopener"
        >
          Docs
        </a>
      </div>
      {data && (
        <pre className="bg-gray-100 p-4 rounded-md">
          <code>
            Message: {data.message} <br />
          </code>
          <div>
            {data.findings?.map((i) => (
              <div key={i.ruleId} className="">
                <p>{i.matchedText}</p>
                <p>{i.ruleId}</p>
                <p>{i.ruleName}</p>
                <p>{i.severity}</p>
              </div>
            ))}
          </div>
        </pre>
      )}
    </div>
  );
}

export default Index;
