const user = import.meta.env.EUROPLAZA_USER;
const password = import.meta.env.EUROPLAZA_PASSWORD;

if (user && password) {
  await load();
} else {
  console.warn("No europlaza user or password set");
}

const url = {
  api: "https://europlaza.pockethouse.io/api/graphql",
  token:
    "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
};

async function load(): Promise<void> {
  console.log("running");
}

export {};
