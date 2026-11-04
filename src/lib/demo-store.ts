import "server-only";
import { cookies, headers } from "next/headers";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { demoCookie, demoSessionSchema, isLocalDemo } from "./data-mode";
import type { ActionResult, Receipt, RentRow } from "./rent";

type Apartment = {
  id: string;
  name: string;
  rent: number;
  day: number;
  start: string;
};
type Month = RentRow & { rental_month: string };
type State = {
  version: 1;
  generation: string;
  apartments: Apartment[];
  months: Month[];
  receipts: Receipt[];
};

function seed(month: string): State {
  const names = [
    "Квартира у парка",
    "Квартира на набережной",
    "Квартира в центре",
    "Старый город",
    "Солнечная квартира",
    "Квартира у сквера",
    "Тихий двор",
    "Квартира на холме",
    "Светлая студия",
    "Квартира у метро",
  ];
  const rents = [
    120000, 90000, 100000, 80000, 110000, 75000, 95000, 130000, 65000, 105000,
  ];
  const apartments = names.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    rent: rents[index],
    day: [1, 10, 1, 15, 20, 28, 5, 10, 15, 20][index],
    start: month,
  }));
  return {
    version: 1,
    generation: crypto.randomUUID(),
    apartments,
    months: [],
    receipts: [1, 2].map((index) => ({
      id: crypto.randomUUID(),
      apartment_id: apartments[index].id,
      rental_month: `${month}-01`,
      amount_cents: index === 1 ? 45000 : 100000,
      received_on: `${month}-01`,
      note: "Тестовое поступление",
    })),
  };
}

// Serialize this local server's operations; files are atomically replaced. This
// disposable adapter is not a multi-process or hosted database replacement.
const globalDemo = globalThis as typeof globalThis & {
  rentalDemoQueue?: Map<string, Promise<unknown>>;
};
const queue = (globalDemo.rentalDemoQueue ??= new Map());

async function transaction<T>(
  month: string,
  change: (state: State) => T,
  reset = false,
): Promise<T> {
  if (!isLocalDemo((await headers()).get("host")))
    throw new Error("Local demo is unavailable");
  const session = (await cookies()).get(demoCookie)?.value;
  if (!demoSessionSchema.safeParse(session).success)
    throw new Error("Missing demo session");
  const folder = process.env.RENTAL_MANAGER_DEMO_DIR || ".local-demo/data";
  const file = join(folder, `${session}.json`);
  const previous = queue.get(file) ?? Promise.resolve();
  const operation = previous
    .catch(() => {})
    .then(async () => {
      await mkdir(folder, { recursive: true });
      let state: State;
      if (reset) state = seed(month);
      else {
        try {
          state = JSON.parse(await readFile(file, "utf8")) as State;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          state = seed(month);
        }
      }
      const result = change(state);
      const temporary = `${file}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
      await rename(temporary, file);
      return result;
    });
  queue.set(file, operation);
  try {
    return await operation;
  } finally {
    if (queue.get(file) === operation) queue.delete(file);
  }
}

function monthRows(state: State, month: string): RentRow[] {
  for (const apartment of state.apartments) {
    if (
      apartment.start > month ||
      state.months.some(
        (row) =>
          row.apartment_id === apartment.id && row.rental_month === month,
      )
    )
      continue;
    state.months.push({
      apartment_id: apartment.id,
      name: apartment.name,
      expected_cents: apartment.rent,
      due_date: `${month}-${String(apartment.day).padStart(2, "0")}`,
      rental_month: month,
    });
  }
  return state.months.filter((row) => row.rental_month === month);
}

export async function readDemoMonth(month: string) {
  return transaction(month, (state) => ({
    generation: state.generation,
    rows: monthRows(state, month),
    receipts: state.receipts.filter(
      (receipt) => receipt.rental_month === `${month}-01`,
    ),
  }));
}

export async function addDemoApartment(input: {
  id: string;
  name: string;
  rent: number;
  day: number;
  month: string;
}): Promise<ActionResult> {
  return transaction(input.month, (state) => {
    const prior = state.apartments.find(
      (apartment) => apartment.id === input.id,
    );
    const apartment = {
      id: input.id,
      name: input.name,
      rent: input.rent,
      day: input.day,
      start: input.month,
    };
    if (prior && JSON.stringify(prior) !== JSON.stringify(apartment))
      return { error: "save" };
    if (!prior) state.apartments.push(apartment);
    return { ok: true };
  });
}

export async function recordDemoReceipt(input: {
  id: string;
  apartmentId: string;
  month: string;
  amount: number;
  date: string;
  note: string;
}): Promise<ActionResult> {
  return transaction(input.month, (state) => {
    const receipt: Receipt = {
      id: input.id,
      apartment_id: input.apartmentId,
      rental_month: `${input.month}-01`,
      amount_cents: input.amount,
      received_on: input.date,
      note: input.note,
    };
    const prior = state.receipts.find((entry) => entry.id === input.id);
    if (prior)
      return JSON.stringify(prior) === JSON.stringify(receipt)
        ? { ok: true }
        : { error: "save" };
    const row = monthRows(state, input.month).find(
      (row) => row.apartment_id === input.apartmentId,
    );
    if (!row) return { error: "invalid" };
    const received = state.receipts
      .filter(
        (entry) =>
          entry.apartment_id === input.apartmentId &&
          entry.rental_month === receipt.rental_month,
      )
      .reduce((sum, entry) => sum + entry.amount_cents, 0);
    if (input.amount > row.expected_cents - received)
      return { error: "balance" };
    state.receipts.push(receipt);
    return { ok: true };
  });
}

export async function resetDemoMonth(month: string) {
  return transaction(month, () => ({ ok: true as const }), true);
}
