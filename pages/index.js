import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Plus, Settings, X, ChevronDown, ChevronRight, Paperclip,
  Trash2, Pencil, Search, FileText, Image as ImageIcon, AlertCircle,
  Filter, Loader2, ClipboardList, LogOut, TrendingUp, Clock, AlertTriangle, ListChecks,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  TYPES_INTERVENTION, MISSIONS, TVA_OPTIONS, REGLEMENT_OPTIONS, ORIGINE_OPTIONS,
  REQUIRED_FIELDS, FIELD_LABELS, emptyForm, formatMontant, monthKey, monthLabel,
} from "../lib/constants";

export default function CRMInterventions() {
  const router = useRouter();
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [agences, setAgences] = useState([]);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // File objects à uploader
  const [attachWarning, setAttachWarning] = useState("");
  const [saving, setSaving] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [newTechnicien, setNewTechnicien] = useState("");
  const [newAgence, setNewAgence] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    technicien: "", agence: "", nom: "", numDevis: "", numFacture: "",
    typeReglement: "", aFinirOnly: false, dateFrom: "", dateTo: "",
  });

  const [expandedMonths, setExpandedMonths] = useState({});
  const [viewingAttachments, setViewingAttachments] = useState(null);

  /* ----- Authentification ----- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  /* ----- Chargement des données ----- */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [intRes, techRes, agRes] = await Promise.all([
        supabase.from("interventions").select("*").order("date_intervention", { ascending: false }),
        supabase.from("techniciens").select("*").order("nom"),
        supabase.from("agences").select("*").order("nom"),
      ]);
      if (intRes.error) throw intRes.error;
      setInterventions(intRes.data || []);
      setTechniciens((techRes.data || []).map((t) => t.nom));
      setAgences((agRes.data || []).map((a) => a.nom));
      const curKey = monthKey(new Date().toISOString());
      setExpandedMonths({ [curKey]: true });
      setError("");
    } catch (e) {
      setError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ----- Listes techniciens / agences ----- */
  const addTechnicien = async () => {
    const v = newTechnicien.trim();
    if (!v || techniciens.includes(v)) return;
    const { error } = await supabase.from("techniciens").insert({ nom: v });
    if (!error) { setTechniciens((p) => [...p, v]); setNewTechnicien(""); }
  };
  const addAgence = async () => {
    const v = newAgence.trim();
    if (!v || agences.includes(v)) return;
    const { error } = await supabase.from("agences").insert({ nom: v });
    if (!error) { setAgences((p) => [...p, v]); setNewAgence(""); }
  };
  const removeTechnicien = async (v) => {
    await supabase.from("techniciens").delete().eq("nom", v);
    setTechniciens((p) => p.filter((t) => t !== v));
  };
  const removeAgence = async (v) => {
    await supabase.from("agences").delete().eq("nom", v);
    setAgences((p) => p.filter((a) => a !== v));
  };

  /* ----- Formulaire ----- */
  const openNewForm = () => {
    setForm(emptyForm());
    setPendingFiles([]);
    setFormErrors([]);
    setAttachWarning("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setForm({ ...item });
    setPendingFiles([]);
    setFormErrors([]);
    setAttachWarning("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setForm(emptyForm()); setPendingFiles([]); };

  const setField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "type_intervention") next.mission = "";
      return next;
    });
  };

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachWarning("");
    const ok = [];
    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        setAttachWarning(`"${file.name}" dépasse 8 Mo et n'a pas été ajouté.`);
        return;
      }
      ok.push(file);
    });
    setPendingFiles((prev) => [...prev, ...ok]);
    e.target.value = "";
  };

  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const removeSavedAttachment = (idx) => {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    const missing = REQUIRED_FIELDS.filter((f) => {
      const v = form[f];
      return v === undefined || v === null || String(v).trim() === "";
    });
    setFormErrors(missing);
    return missing.length === 0;
  };

  const uploadPendingFiles = async (interventionId) => {
    const uploaded = [];
    for (const file of pendingFiles) {
      const path = `${interventionId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        uploaded.push({ name: file.name, type: file.type, url: data.publicUrl, path });
      }
    }
    return uploaded;
  };

  const saveForm = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        technicien: form.technicien, agence: form.agence,
        type_intervention: form.type_intervention, mission: form.mission,
        client_nom: form.client_nom, client_adresse: form.client_adresse,
        client_cp: form.client_cp, client_ville: form.client_ville, client_tel: form.client_tel,
        num_devis: form.num_devis, num_facture: form.num_facture,
        date_facture: form.date_facture || null,
        montant_ttc: parseFloat(form.montant_ttc) || 0,
        tva: form.tva, type_reglement: form.type_reglement, payee: !!form.payee,
        origine: form.origine, date_intervention: form.date_intervention,
        a_finir: !!form.a_finir, commentaire: form.commentaire || null,
        attachments: form.attachments || [],
      };

      let savedId = form.id;
      if (form.id) {
        const { error } = await supabase.from("interventions").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("interventions").insert(payload).select().single();
        if (error) throw error;
        savedId = data.id;
      }

      if (pendingFiles.length > 0) {
        const uploaded = await uploadPendingFiles(savedId);
        const finalAttachments = [...(payload.attachments || []), ...uploaded];
        await supabase.from("interventions").update({ attachments: finalAttachments }).eq("id", savedId);
      }

      await loadAll();
      closeForm();
    } catch (e) {
      setError("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const deleteIntervention = async (id) => {
    await supabase.from("interventions").delete().eq("id", id);
    setInterventions((prev) => prev.filter((i) => i.id !== id));
  };

  const togglePayee = async (item) => {
    const next = !item.payee;
    setInterventions((prev) => prev.map((i) => (i.id === item.id ? { ...i, payee: next } : i)));
    await supabase.from("interventions").update({ payee: next }).eq("id", item.id);
  };

  const toggleAFinir = async (item) => {
    const next = !item.a_finir;
    setInterventions((prev) => prev.map((i) => (i.id === item.id ? { ...i, a_finir: next } : i)));
    await supabase.from("interventions").update({ a_finir: next }).eq("id", item.id);
  };

  /* ----- Filtrage & regroupement ----- */
  const filtered = useMemo(() => {
    return interventions.filter((i) => {
      if (filters.technicien && i.technicien !== filters.technicien) return false;
      if (filters.agence && i.agence !== filters.agence) return false;
      if (filters.nom && !i.client_nom?.toLowerCase().includes(filters.nom.toLowerCase())) return false;
      if (filters.numDevis && !i.num_devis?.toLowerCase().includes(filters.numDevis.toLowerCase())) return false;
      if (filters.numFacture && !i.num_facture?.toLowerCase().includes(filters.numFacture.toLowerCase())) return false;
      if (filters.typeReglement && i.type_reglement !== filters.typeReglement) return false;
      if (filters.aFinirOnly && !i.a_finir) return false;
      if (filters.dateFrom && i.date_intervention < filters.dateFrom) return false;
      if (filters.dateTo && i.date_intervention > filters.dateTo) return false;
      return true;
    });
  }, [interventions, filters]);

  const aFinirList = useMemo(
    () => filtered.filter((i) => i.a_finir).sort((a, b) => (b.date_intervention || "").localeCompare(a.date_intervention || "")),
    [filtered]
  );

  const groupedByMonth = useMemo(() => {
    const rest = filtered.filter((i) => !i.a_finir);
    const groups = {};
    rest.forEach((i) => {
      const k = monthKey(i.date_intervention);
      if (!groups[k]) groups[k] = [];
      groups[k].push(i);
    });
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => (b.date_intervention || "").localeCompare(a.date_intervention || ""))
    );
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const toggleMonth = (key) => setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => (k === "aFinirOnly" ? v === true : v !== "")).length;

  if (session === undefined || (session && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen">
      <header
        className="text-[#FAF6F3] sticky top-0 z-20 shadow-lg"
        style={{ background: "linear-gradient(120deg, #150E0B 0%, #1F120C 55%, #2A1710 100%)", borderBottom: "2px solid #FF6B35" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center ticket-font font-extrabold text-white text-base shrink-0"
              style={{ background: "linear-gradient(135deg, #FF6B35, #B3202F)" }}
            >
              A
            </div>
            <div>
              <h1 className="ticket-font text-lg font-extrabold leading-none tracking-tight">
                AUBERT <span style={{ color: "#FF6B35" }}>CRM</span>
              </h1>
              <p className="text-[11px] text-[#C9BBAF] mt-0.5">Plomberie · Serrurerie · Vitrerie</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Paramètres">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10" aria-label="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={openNewForm}
              className="flex items-center gap-1.5 text-white font-semibold px-3.5 py-2 rounded-lg hover:brightness-110 text-sm shadow-md"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E8502A)" }}
            >
              <Plus className="w-4 h-4" /> Nouvelle
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 pb-24">
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#B3202F]/10 border border-[#B3202F]/30 text-[#8f3247] px-3 py-2 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <StatsBar interventions={interventions} />

        <div className="mb-5 bg-white rounded-lg border border-[#E4DCD1] shadow-sm">

          <button onClick={() => setShowFilters((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#FF6B35]" /> Filtres
              {activeFilterCount > 0 && <span className="bg-[#FF6B35] text-white text-[11px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </span>
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showFilters && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Technicien">
                <select className="input" value={filters.technicien} onChange={(e) => setFilters((f) => ({ ...f, technicien: e.target.value }))}>
                  <option value="">Tous</option>
                  {techniciens.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Agence">
                <select className="input" value={filters.agence} onChange={(e) => setFilters((f) => ({ ...f, agence: e.target.value }))}>
                  <option value="">Toutes</option>
                  {agences.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Nom client">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#9C978A]" />
                  <input className="input pl-7" value={filters.nom} onChange={(e) => setFilters((f) => ({ ...f, nom: e.target.value }))} />
                </div>
              </Field>
              <Field label="N° devis">
                <input className="input" value={filters.numDevis} onChange={(e) => setFilters((f) => ({ ...f, numDevis: e.target.value }))} />
              </Field>
              <Field label="N° facture">
                <input className="input" value={filters.numFacture} onChange={(e) => setFilters((f) => ({ ...f, numFacture: e.target.value }))} />
              </Field>
              <Field label="Type de règlement">
                <select className="input" value={filters.typeReglement} onChange={(e) => setFilters((f) => ({ ...f, typeReglement: e.target.value }))}>
                  <option value="">Tous</option>
                  {REGLEMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Du">
                <input type="date" className="input" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
              </Field>
              <Field label="Au">
                <input type="date" className="input" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
              </Field>
              <label className="flex items-center gap-2 text-sm mt-5">
                <input type="checkbox" checked={filters.aFinirOnly} onChange={(e) => setFilters((f) => ({ ...f, aFinirOnly: e.target.checked }))} />
                Bons à finir uniquement
              </label>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ technicien: "", agence: "", nom: "", numDevis: "", numFacture: "", typeReglement: "", aFinirOnly: false, dateFrom: "", dateTo: "" })}
                  className="text-sm text-[#FF6B35] underline self-end mb-1"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {interventions.length === 0 && (
          <div className="text-center py-16 text-[#8b8677]">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="ticket-font text-lg">Aucune intervention enregistrée</p>
            <p className="text-sm">Ajoutez votre première fiche avec le bouton « Nouvelle ».</p>
          </div>
        )}

        {(aFinirList.length > 0 || groupedByMonth.length > 0) && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[900px]">
              <RowHeader />

              {aFinirList.length > 0 && (
                <section className="mb-6">
                  <h2 className="ticket-font uppercase text-sm font-bold text-[#8a5a10] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E8A33D]" /> À finir ({aFinirList.length})
                  </h2>
                  <div className="rounded-lg overflow-hidden border border-[#E4DCD1] bg-white">
                    {aFinirList.map((item) => (
                      <InterventionRow key={item.id} item={item} onEdit={() => openEditForm(item)} onDelete={() => deleteIntervention(item.id)}
                        onTogglePayee={() => togglePayee(item)} onToggleAFinir={() => toggleAFinir(item)} onViewAttachments={() => setViewingAttachments(item.id)} />
                    ))}
                  </div>
                </section>
              )}

              {groupedByMonth.map(([key, items]) => {
                const total = items.reduce((s, i) => s + (parseFloat(i.montant_ttc) || 0), 0);
                const isOpen = !!expandedMonths[key];
                return (
                  <section key={key} className="mb-3 bg-white rounded-lg border border-[#E4DCD1] shadow-sm overflow-hidden">
                    <button onClick={() => toggleMonth(key)} className="w-full flex items-center justify-between px-4 py-3">
                      <span className="ticket-font uppercase text-base font-bold flex items-center gap-2">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {monthLabel(key)}
                        <span className="text-xs font-normal text-[#8b8677] normal-case">({items.length})</span>
                      </span>
                      <span className="mono-font text-sm font-semibold text-[#FF6B35]">{formatMontant(total)}</span>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3">
                        <div className="rounded-lg overflow-hidden border border-[#E4DCD1]">
                          {items.map((item) => (
                            <InterventionRow key={item.id} item={item} onEdit={() => openEditForm(item)} onDelete={() => deleteIntervention(item.id)}
                              onTogglePayee={() => togglePayee(item)} onToggleAFinir={() => toggleAFinir(item)} onViewAttachments={() => setViewingAttachments(item.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <Modal onClose={closeForm} title={form.id ? "Modifier l'intervention" : "Nouvelle intervention"}>
          {formErrors.length > 0 && (
            <div className="mb-4 flex items-start gap-2 bg-[#B3202F]/10 border border-[#B3202F]/30 text-[#8f3247] px-3 py-2 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Champs obligatoires manquants : {formErrors.map((f) => FIELD_LABELS[f]).join(", ")}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Technicien *" error={formErrors.includes("technicien")}>
              <select className="input" value={form.technicien} onChange={(e) => setField("technicien", e.target.value)}>
                <option value="">Sélectionner…</option>
                {techniciens.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Agence (ville d'intervention) *" error={formErrors.includes("agence")}>
              <select className="input" value={form.agence} onChange={(e) => setField("agence", e.target.value)}>
                <option value="">Sélectionner…</option>
                {agences.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Type d'intervention *" error={formErrors.includes("type_intervention")}>
              <select className="input" value={form.type_intervention} onChange={(e) => setField("type_intervention", e.target.value)}>
                <option value="">Sélectionner…</option>
                {TYPES_INTERVENTION.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Mission *" error={formErrors.includes("mission")}>
              <select className="input" value={form.mission} disabled={!form.type_intervention} onChange={(e) => setField("mission", e.target.value)}>
                <option value="">{form.type_intervention ? "Sélectionner…" : "Choisir un type d'abord"}</option>
                {(MISSIONS[form.type_intervention] || []).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="Nom client *" error={formErrors.includes("client_nom")} span2>
              <input className="input" value={form.client_nom} onChange={(e) => setField("client_nom", e.target.value)} />
            </Field>
            <Field label="Adresse client *" error={formErrors.includes("client_adresse")} span2>
              <input className="input" value={form.client_adresse} onChange={(e) => setField("client_adresse", e.target.value)} />
            </Field>
            <Field label="Code postal *" error={formErrors.includes("client_cp")}>
              <input className="input" value={form.client_cp} onChange={(e) => setField("client_cp", e.target.value)} />
            </Field>
            <Field label="Ville client *" error={formErrors.includes("client_ville")}>
              <input className="input" value={form.client_ville} onChange={(e) => setField("client_ville", e.target.value)} />
            </Field>
            <Field label="Tél. client *" error={formErrors.includes("client_tel")}>
              <input className="input" value={form.client_tel} onChange={(e) => setField("client_tel", e.target.value)} />
            </Field>

            <Field label="N° devis (optionnel)">
              <input className="input mono-font" value={form.num_devis || ""} onChange={(e) => setField("num_devis", e.target.value)} />
            </Field>
            <Field label="N° facture *" error={formErrors.includes("num_facture")}>
              <input className="input mono-font" value={form.num_facture} onChange={(e) => setField("num_facture", e.target.value)} />
            </Field>
            <Field label="Date facture (optionnel)">
              <input type="date" className="input" value={form.date_facture || ""} onChange={(e) => setField("date_facture", e.target.value)} />
            </Field>
            <Field label="Date intervention *" error={formErrors.includes("date_intervention")}>
              <input type="date" className="input" value={form.date_intervention || ""} onChange={(e) => setField("date_intervention", e.target.value)} />
            </Field>

            <Field label="Montant TTC (€) *" error={formErrors.includes("montant_ttc")}>
              <input type="number" step="0.01" className="input mono-font" value={form.montant_ttc} onChange={(e) => setField("montant_ttc", e.target.value)} />
            </Field>
            <Field label="TVA *" error={formErrors.includes("tva")}>
              <select className="input" value={form.tva} onChange={(e) => setField("tva", e.target.value)}>
                <option value="">Sélectionner…</option>
                {TVA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Type de règlement *" error={formErrors.includes("type_reglement")}>
              <select className="input" value={form.type_reglement} onChange={(e) => setField("type_reglement", e.target.value)}>
                <option value="">Sélectionner…</option>
                {REGLEMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Origine intervention *" error={formErrors.includes("origine")}>
              <select className="input" value={form.origine} onChange={(e) => setField("origine", e.target.value)}>
                <option value="">Sélectionner…</option>
                {ORIGINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>

            <div className="flex items-center gap-4 sm:col-span-2 pt-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!form.payee} onChange={(e) => setField("payee", e.target.checked)} />
                Payée (encaissement reçu)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#8a5a10]">
                <input type="checkbox" checked={!!form.a_finir} onChange={(e) => setField("a_finir", e.target.checked)} />
                Intervention à finir
              </label>
            </div>

            <Field label="Commentaire" span2>
              <textarea className="input min-h-[70px]" value={form.commentaire || ""} onChange={(e) => setField("commentaire", e.target.value)} />
            </Field>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#5c584d] block mb-1">Pièces jointes (devis, facture, photos avant/après…)</label>
              <label className="flex items-center gap-2 justify-center border-2 border-dashed border-[#E4DCD1] rounded-md py-3 cursor-pointer hover:border-[#FF6B35] text-sm text-[#5c584d]">
                <Paperclip className="w-4 h-4" /> Ajouter des fichiers (PDF, photos)
                <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={onFilesSelected} />
              </label>
              {attachWarning && <p className="text-xs text-[#B3202F] mt-1">{attachWarning}</p>}
              {(form.attachments || []).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.attachments.map((a, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-[#FAF6F3] rounded px-2 py-1.5 text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        {a.type?.includes("pdf") ? <FileText className="w-3.5 h-3.5 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{a.name}</span>
                      </span>
                      <button onClick={() => removeSavedAttachment(idx)} className="text-[#B3202F] shrink-0 ml-2"><X className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ul>
              )}
              {pendingFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {pendingFiles.map((f, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-[#EDF3F6] rounded px-2 py-1.5 text-xs">
                      <span className="truncate">{f.name} (à envoyer)</span>
                      <button onClick={() => removePendingFile(idx)} className="text-[#B3202F] shrink-0 ml-2"><X className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#E4DCD1]">
            <button onClick={closeForm} className="px-4 py-2 rounded-md text-sm font-medium text-[#5c584d] hover:bg-[#FAF6F3]">Annuler</button>
            <button onClick={saveForm} disabled={saving} className="px-4 py-2 rounded-md text-sm font-semibold bg-[#FF6B35] text-white hover:brightness-110 flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="Paramètres — listes déroulantes">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="ticket-font uppercase font-bold text-sm mb-2">Techniciens</h3>
              <div className="flex gap-2 mb-2">
                <input className="input" value={newTechnicien} onChange={(e) => setNewTechnicien(e.target.value)} placeholder="Nom du technicien" />
                <button onClick={addTechnicien} className="px-3 rounded-md bg-[#FF6B35] text-white"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {techniciens.map((t) => (
                  <li key={t} className="flex items-center justify-between bg-[#FAF6F3] rounded px-2 py-1.5 text-sm">
                    {t}
                    <button onClick={() => removeTechnicien(t)} className="text-[#B3202F]"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
                {techniciens.length === 0 && <p className="text-xs text-[#8b8677]">Aucun technicien pour l'instant.</p>}
              </ul>
            </div>
            <div>
              <h3 className="ticket-font uppercase font-bold text-sm mb-2">Agences</h3>
              <div className="flex gap-2 mb-2">
                <input className="input" value={newAgence} onChange={(e) => setNewAgence(e.target.value)} placeholder="Ville / agence" />
                <button onClick={addAgence} className="px-3 rounded-md bg-[#FF6B35] text-white"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {agences.map((a) => (
                  <li key={a} className="flex items-center justify-between bg-[#FAF6F3] rounded px-2 py-1.5 text-sm">
                    {a}
                    <button onClick={() => removeAgence(a)} className="text-[#B3202F]"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
                {agences.length === 0 && <p className="text-xs text-[#8b8677]">Aucune agence pour l'instant.</p>}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {viewingAttachments && (
        <Modal onClose={() => setViewingAttachments(null)} title="Pièces jointes">
          {(() => {
            const item = interventions.find((i) => i.id === viewingAttachments);
            const atts = item?.attachments || [];
            if (atts.length === 0) return <p className="text-sm text-[#8b8677]">Aucune pièce jointe pour cette intervention.</p>;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {atts.map((a, idx) => (
                  <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="border border-[#E4DCD1] rounded-md p-2 flex flex-col items-center gap-1.5 hover:border-[#FF6B35]">
                    {a.type?.startsWith("image/") ? (
                      <img src={a.url} alt={a.name} className="w-full h-20 object-cover rounded" />
                    ) : (
                      <FileText className="w-8 h-8 text-[#FF6B35]" />
                    )}
                    <span className="text-[11px] text-center truncate w-full">{a.name}</span>
                  </a>
                ))}
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

function StatsBar({ interventions }) {
  const now = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = interventions.filter((i) => monthKey(i.date_intervention) === curKey);
  const montantMois = thisMonth.reduce((s, i) => s + (parseFloat(i.montant_ttc) || 0), 0);
  const enAttente = interventions.filter((i) => i.type_reglement === "En attente de règlement" && !i.payee).length;
  const aFinir = interventions.filter((i) => i.a_finir).length;

  const cards = [
    { label: "Interventions ce mois", value: thisMonth.length, icon: ListChecks, color: "#FF6B35" },
    { label: "Chiffre du mois", value: formatMontant(montantMois), icon: TrendingUp, color: "#1A1512" },
    { label: "En attente de règlement", value: enAttente, icon: Clock, color: "#B3202F" },
    { label: "À finir", value: aFinir, icon: AlertTriangle, color: "#C97A0E" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-[#E4DCD1] shadow-sm p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}1A` }}>
            <c.icon className="w-4.5 h-4.5" style={{ color: c.color }} />
          </div>
          <div className="min-w-0">
            <p className="mono-font text-lg font-bold leading-none truncate" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[11px] text-[#8b8677] mt-1 truncate">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, error, span2 }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      {label && <label className={`text-xs font-medium block mb-1 ${error ? "text-[#B3202F]" : "text-[#5c584d]"}`}>{label}</label>}
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-30 p-3 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-6 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4DCD1] sticky top-0 bg-white rounded-t-lg">
          <h2 className="ticket-font uppercase text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#FAF6F3]"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

const ROW_COLUMNS = "100px minmax(180px,1.6fr) 130px 130px 150px 100px 150px 70px 70px 100px";

function RowHeader() {
  return (
    <div
      className="grid items-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8b8677] border-b-2 border-[#E4DCD1]"
      style={{ gridTemplateColumns: ROW_COLUMNS }}
    >
      <span>Date</span>
      <span>Client</span>
      <span>Technicien</span>
      <span>Agence</span>
      <span>Type / Mission</span>
      <span className="text-right">Montant</span>
      <span>Règlement</span>
      <span className="text-center">Payée</span>
      <span className="text-center">À finir</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

function InterventionRow({ item, onEdit, onDelete, onTogglePayee, onToggleAFinir, onViewAttachments }) {
  const attente = item.type_reglement === "En attente de règlement" && !item.payee;
  let leftBar = "transparent";
  let bg = "white";
  if (item.a_finir) { leftBar = "#E8A33D"; bg = "#FDF6E8"; }
  else if (attente) { leftBar = "#B3202F"; bg = "#FBEDEF"; }

  const dateFmt = item.date_intervention ? new Date(item.date_intervention).toLocaleDateString("fr-FR") : "—";

  return (
    <div
      onClick={onEdit}
      className="grid items-center px-3 py-2.5 text-sm border-b border-[#EFEBE0] last:border-b-0 hover:bg-black/[0.02] cursor-pointer"
      style={{ gridTemplateColumns: ROW_COLUMNS, borderLeft: `4px solid ${leftBar}`, background: bg }}
      title={item.commentaire || ""}
    >
      <span className="text-xs text-[#5c584d]">{dateFmt}</span>
      <span className="font-semibold truncate pr-2" title={item.client_nom}>{item.client_nom}</span>
      <span className="text-xs truncate pr-2">{item.technicien}</span>
      <span className="text-xs truncate pr-2">{item.agence}</span>
      <span className="text-xs truncate pr-2">
        <span className="px-1.5 py-0.5 rounded bg-[#EDEAE0] text-[#5c584d] mr-1">{item.type_intervention}</span>
        <span className="text-[#8b8677]">{item.mission}</span>
      </span>
      <span className="mono-font font-bold text-right text-[#1A1512]">{formatMontant(item.montant_ttc)}</span>
      <span className="text-xs truncate pr-2">{item.type_reglement}</span>
      <span className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={!!item.payee} onChange={onTogglePayee} />
      </span>
      <span className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={!!item.a_finir} onChange={onToggleAFinir} />
      </span>
      <span className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={onViewAttachments} className="p-1.5 rounded hover:bg-black/5" title="Pièces jointes"><Paperclip className="w-3.5 h-3.5" /></button>
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-black/5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-black/5 text-[#B3202F]" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
      </span>
    </div>
  );
}
