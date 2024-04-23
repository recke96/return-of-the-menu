const user = import.meta.env.EUROPLAZA_USER;
const password = import.meta.env.EUROPLAZA_PASSWORD;

if (user && password) {
  await load();
} else {
  console.warn("No europlaza user or password set");
}

async function load(): Promise<void> {
  console.log("running");
}

export {};
