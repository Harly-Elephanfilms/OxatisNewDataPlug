import { connection } from "next/server";
import { parisDate } from "@/lib/order-export";
import OrdersWorkspace from "./OrdersWorkspace";

export default async function OrdersPage() {
  // La date par défaut doit suivre le jour de la consultation, même si le site
  // a été compilé la veille ; serveur et navigateur hydratent la même valeur.
  await connection();
  return <OrdersWorkspace today={parisDate()} />;
}
