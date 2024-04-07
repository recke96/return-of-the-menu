export type MenuItem = {
  restaurant: { slug: string; name: string };
  menu: string;
  name: string;
  description: string;
  price: number;
  currency: string;
};

export interface RestaurantService {
  getMenu(restaurant: string, date: Date): Promise<ReadonlyArray<MenuItem>>;
}
