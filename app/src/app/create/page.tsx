"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Option = { project_id?: string; project_code?: string; project_name?: string; type_code?: string; type_name?: string; network_code?: string; network_name?: string; template_id?: string; document_type_id?: string; network_id?: string; template_code?: string; template_name?: string; template_version?: string | number; template_file_path?: string | null; is_active?: boolean };
type Field = { field_code: string; field_label: string; data_type: string; is_required: boolean; display_order: number };

export default function CreateDocumentPage() {
  const [options, setOptions] = useState<{projects: Option[]; document_types: Option[]; networks: Option[]; templates: Option[]}>({projects: [], document_types: [], networks: [], templates: []});
  const [project, setProject] = useState("");
  const [type, setType] = useState("");
  const [network, setNetwork] = useState("");
  const [zone, setZone] = useState("");
  const [description, setDescription] = useState("");
  const [numberPreview, setNumberPreview] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_document_creation_options");
      if (error) setError(error.message);
      else setOptions(data || { projects: [], document_types: [], networks: [], templates: [] });
      setLoading(false);
    })();
  }, []);

  const selectedType = options.document_types.find(x => x.type_code === type);
  const selectedNetwork = options.networks.find(x => x.network_code === network && x.project_id === project);
  const selectedTemplate = options.templates.find(x => x.project_id === project && x.document_type_id === selectedType?.document_type_id && x.network_id === selectedNetwork?.network_id && x.is_active);
  const availableNetworks = useMemo(() => options.networks.filter(x => x.project_id === project && (type === "DT" || x.network_code !== "IPC")), [options.networks, project, type]);

  useEffect(() => {
    setNetwork(""); setZone(""); setNumberPreview(""); setFields([]); setValues({}); setError("");
  }, [type, project]);

  useEffect(() => {
    if (!selectedTemplate?.template_id) { setFields([]); return; }
    (async () => {
      const { data, error } = await supabase.from("template_fields").select("field_code,field_label,data_type,is_required,display_order").eq("template_id", selectedTemplate.template_id).eq("is_active", true).order("display_order");
      if (error) setError(error.message); else setFields(data || []);
    })();
  }, [selectedTemplate?.template_id]);

  async function preview() {
    setError(""); setMessage(""); setNumberPreview("");
    if (!project || !type || !network) return setError("Select Project, Document Type and Network first.");
    const { data, error } = await supabase.rpc("preview_document_number", { p_project_id: project, p_document_type_code: type, p_network_code: network, p_zone: zone || null, p_revision: "00" });
    if (error) setError(error.message); else setNumberPreview(data || "");
  }

  async function create() {
    setError(""); setMessage("");
    if (!project || !type || !network) return setError("Select Project, Document Type and Network first.");
    if (!numberPreview) return setError("Generate the number preview first.");
    const missing = fields.filter(f => f.is_required && !values[f.field_code]?.trim());
    if (missing.length) return setError(`Complete required field: ${missing[0].field_label}`);
    setBusy(true);
    const { data: documentId, error: createError } = await supabase.rpc("create_document_next", { p_project_id: project, p_document_type_code: type, p_network_code: network, p_zone: zone || null, p_description: description || null, p_created_by: null });
    if (createError) { setError(createError.message); setBusy(false); return; }
    const revision = await supabase.from("document_revisions").select("revision_id").eq("document_id", documentId).eq("is_current", true).maybeSingle();
    if (revision.error) { setError(revision.error.message); setBusy(false); return; }
    for (const field of fields) {
      const value = values[field.field_code];
      if (!value) continue;
      const def = await supabase.from("field_definitions").select("field_id").eq("field_code", field.field_code).maybeSingle();
      if (def.data?.field_id) await supabase.from("document_field_values").insert({ document_id: documentId, revision_id: revision.data?.revision_id ?? null, field_id: def.data.field_id, field_value: value });
    }
    setMessage(`Document created successfully: ${numberPreview}`); setBusy(false);
  }

  if (loading) return <main className="min-h-screen bg-slate-100 p-8"><div className="max-w-5xl mx-auto bg-white rounded-xl p-8">Loading configuration...</div></main>;

  return <main className="min-h-screen bg-slate-100 text-slate-900 p-8">
    <div className="max-w-5xl mx-auto">
      <div className="mb-8"><h1 className="text-3xl font-bold">Create Document</h1><p className="text-slate-500 mt-1">Configuration-driven document creation</p></div>
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>}
      <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-lg mb-5">1. Document Setup</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Select label="Project" value={project} onChange={setProject} options={options.projects.map(x => ({value:x.project_id!,label:`${x.project_code} — ${x.project_name}`}))}/>
          <Select label="Document Type" value={type} onChange={setType} options={options.document_types.map(x => ({value:x.type_code!,label:`${x.type_code} — ${x.type_name}`}))}/>
          <Select label="Network" value={network} onChange={setNetwork} options={availableNetworks.map(x => ({value:x.network_code!,label:`${x.network_code} — ${x.network_name}`}))}/>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Input label="Zone (if required by numbering rule)" value={zone} onChange={setZone} placeholder="e.g. V1"/>
          <Input label="Description" value={description} onChange={setDescription} placeholder="Document description"/>
        </div>
        <div className="mt-5 rounded-lg bg-slate-50 border p-4 flex items-center justify-between gap-4">
          <div><div className="text-xs text-slate-500">Number Preview</div><div className="font-mono font-semibold mt-1">{numberPreview || "—"}</div></div>
          <button onClick={preview} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">Generate Preview</button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-lg mb-2">2. Active Template</h2>
        {selectedTemplate ? <div className="border rounded-lg p-4"><div className="font-semibold">{selectedTemplate.template_name}</div><div className="text-sm text-slate-500 mt-1">Version {selectedTemplate.template_version ?? "—"}</div><div className="text-xs text-slate-400 mt-2">{selectedTemplate.template_file_path || "Template file path not registered"}</div></div> : <div className="border border-dashed rounded-lg p-6 text-slate-500">No active form configured for this Project + Type + Network.</div>}
      </section>

      {selectedTemplate && <section className="bg-white rounded-xl shadow-sm p-6 mb-6"><h2 className="font-semibold text-lg mb-5">3. Form Data</h2>{fields.length ? <div className="grid md:grid-cols-2 gap-4">{fields.map(f => <Input key={f.field_code} label={`${f.field_label}${f.is_required ? " *" : ""}`} value={values[f.field_code] || ""} onChange={v => setValues(prev => ({...prev,[f.field_code]:v}))} />)}</div> : <div className="text-slate-500">No dynamic fields configured. Type-specific fields will be connected from the approved form mapping.</div>}</section>}

      <div className="flex justify-end"><button disabled={busy || !selectedTemplate} onClick={create} className="bg-slate-900 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg">{busy ? "Creating..." : "Create Document"}</button></div>
    </div>
  </main>;
}

function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) { return <label className="block"><span className="text-sm font-medium">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white"><option value="">Select...</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>; }
function Input({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}) { return <label className="block"><span className="text-sm font-medium">{label}</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>; }
