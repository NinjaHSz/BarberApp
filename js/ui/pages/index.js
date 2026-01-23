import { Dashboard } from "./Dashboard.js";
import { RecordsPage } from "./RecordsPage.js";
import { ManagePage } from "./ManagePage.js";
import { ClientsPage } from "./ClientsPage.js";
import { PlansPage } from "./PlansPage.js";
import { ClientProfilePage } from "./ClientProfilePage.js";
import { SetupPage } from "./SetupPage.js";
import { ExpensesPage } from "./ExpensesPage.js";
import { CardsPage } from "./CardsPage.js";
import { CardProfilePage } from "./CardProfilePage.js";

export const pages = {
  dashboard: Dashboard,
  records: RecordsPage,
  manage: ManagePage,
  clients: ClientsPage,
  plans: PlansPage,
  "client-profile": ClientProfilePage,
  setup: SetupPage,
  expenses: ExpensesPage,
  cards: CardsPage,
  "card-profile": CardProfilePage,
};
