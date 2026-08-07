export const TYPES_INTERVENTION = ["Plomberie", "Serrurerie", "Vitrerie"];

export const MISSIONS = {
  Plomberie: [
    "Fuite d'eau", "Débouchage canalisation", "Recherche de fuite",
    "Remplacement chauffe-eau", "Installation sanitaire",
    "Réparation robinetterie", "Autre",
  ],
  Serrurerie: [
    "Ouverture de porte", "Changement de serrure", "Mise en sécurité",
    "Blindage de porte", "Reproduction de clés", "Autre",
  ],
  Vitrerie: [
    "Remplacement vitrage", "Vitre cassée", "Mise en sécurité",
    "Survitrage", "Autre",
  ],
};

export const TVA_OPTIONS = ["0%", "10%", "20%"];
export const REGLEMENT_OPTIONS = ["CB", "Chèque", "Virement", "Espèces", "En attente de règlement"];
export const ORIGINE_OPTIONS = ["Assurance", "Google", "Annuaire", "Bouche à oreille", "Site internet", "Autre"];

export const REQUIRED_FIELDS = [
  "technicien", "agence", "type_intervention", "mission",
  "client_nom", "client_adresse", "client_cp", "client_ville", "client_tel",
  "num_devis", "num_facture", "montant_ttc", "tva", "type_reglement",
  "origine", "date_intervention",
];

export const FIELD_LABELS = {
  technicien: "Technicien", agence: "Agence", type_intervention: "Type d'intervention",
  mission: "Mission", client_nom: "Nom client", client_adresse: "Adresse client",
  client_cp: "Code postal", client_ville: "Ville client", client_tel: "Tél. client",
  num_devis: "N° devis", num_facture: "N° facture", montant_ttc: "Montant TTC",
  tva: "TVA", type_reglement: "Type de règlement", origine: "Origine intervention",
  date_intervention: "Date intervention",
};

export const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const emptyForm = () => ({
  id: null, technicien: "", agence: "", type_intervention: "", mission: "",
  client_nom: "", client_adresse: "", client_cp: "", client_ville: "", client_tel: "",
  num_devis: "", num_facture: "", date_facture: "", montant_ttc: "", tva: "",
  type_reglement: "", payee: false, origine: "", date_intervention: "",
  a_finir: false, commentaire: "", attachments: [],
});

export function formatMontant(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "0,00 €";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function monthKey(dateStr) {
  if (!dateStr) return "sans-date";
  const d = new Date(dateStr);
  if (isNaN(d)) return "sans-date";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  if (key === "sans-date") return "Sans date";
  const [y, m] = key.split("-");
  return `${MOIS_FR[parseInt(m, 10) - 1]} ${y}`;
}
