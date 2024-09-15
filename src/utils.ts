export const matchCollectionRef = (
  ref:
    | string
    | { id: string; collection: string }
    | { slug: string; collection: string },
  id: string,
) => {
  if (typeof ref === "string") {
    return ref === id;
  }

  if ("id" in ref) {
    return ref.id === id;
  }

  if ("slug" in ref) {
    return ref.slug === "id";
  }

  return false;
};
