import { notFound } from "next/navigation";
import Loading from "@/app/loading";

/** Dev-only preview of the route loading state. */
export default function LoadingPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Loading />;
}
