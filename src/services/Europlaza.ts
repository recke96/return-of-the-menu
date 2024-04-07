import { addSeconds, format } from "date-fns";
import type { MenuItem, RestaurantService } from "./RestaurantService";
import query from "./EuroplazaQuery.graphql?raw";

const idMapping = new Map([
  ["plaza-eurest", 1],
  ["dean-and-david", 2],
  ["gourmet-business", 3],
  ["tuk-tuk", 4],
]);

type EuroplazaMenuItem = {
  id: number;
  title: string;
  content: string;
  price: number;
  currency: string;
};

type EuroplazaWeekdayMenu = {
  id: number;
  date: string;
  menuItems: ReadonlyArray<EuroplazaMenuItem>;
};

type EuroplazaRestaurant = {
  id: number;
  name: string;
  weekdayMenus: ReadonlyArray<EuroplazaWeekdayMenu>;
};

export class EuroplazaRestaurantService implements RestaurantService {
  constructor(private user: string, private password: string) {}

  private tokenURL =
    "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token" as const;
  private apiURL = "https://europlaza.pockethouse.io/api/graphql" as const;

  private token: {
    token: string;
    expires: Date;
  } | null = null;

  async getMenu(
    restaurant: string,
    date: Date
  ): Promise<ReadonlyArray<MenuItem>> {
    const token = await this.getOrFetchToken();

    const dateParam = format(date, "yyyy-MM-dd");
    const id = idMapping.get(restaurant);
    if (!id) {
      console.warn(`Unkown restaurant ${restaurant}`);
      return [];
    }

    const restaurantMenu: EuroplazaRestaurant = await fetch(this.apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: query,
        variables: {
          id: id,
          from: dateParam,
          to: dateParam,
        },
      }),
    })
      .then((r) => r.json())
      .then((r) => r.data.restaurant);

    return restaurantMenu.weekdayMenus.flatMap((dm) =>
      dm.menuItems.flatMap((mi) => ({
        restaurant: { slug: restaurant, name: restaurantMenu.name },
        menu: `${restaurant}-${dm.id}-${mi.id}`,
        name: mi.title,
        description: mi.content,
        price: mi.price / 100,
        currency: mi.currency,
      }))
    );
  }

  private async getOrFetchToken(): Promise<string> {
    const now = new Date();
    if (this.token && this.token.expires < now) {
      return this.token.token;
    }

    this.token = null;

    const auth = Buffer.from(`${this.user}:${this.password}`).toString(
      "base64"
    );

    const credentials = await fetch(this.tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    }).then((r) => r.json());

    this.token = {
      token: credentials["access_token"],
      expires: addSeconds(now, credentials["expires_in"]),
    };
    return this.token.token;
  }
}
