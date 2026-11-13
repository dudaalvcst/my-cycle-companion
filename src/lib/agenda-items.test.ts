import { test } from "node:test";
import { strict as assert } from "node:assert";
import { agendaItems } from "./agenda-items";
test("tasks and appointments share one chronological agenda", () => {
  const result = agendaItems([{id:"event",title:"Consulta",description:null,start_at:"2026-11-20T10:00:00Z",end_at:null,location:null}], [
    {id:"task",title:"Comprar",description:null,due_date:"2026-11-19",priority:"medium",completed:false},
    {id:"undated",title:"Ler",description:null,due_date:null,priority:"low",completed:false},
  ]);
  assert.deepEqual(result.map(item => item.record.id), ["task", "event", "undated"]);
  assert.deepEqual(result.map(item => item.kind), ["task", "event", "task"]);
});