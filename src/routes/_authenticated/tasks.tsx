import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [
    { title: "Tarefas — Três Marias" },
    { name: "description", content: "Suas tarefas agora estão integradas à agenda." },
    { property: "og:title", content: "Tarefas — Três Marias" },
    { property: "og:description", content: "Suas tarefas agora estão integradas à agenda." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Navigate to="/agenda" replace />,
});
