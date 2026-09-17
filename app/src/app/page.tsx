"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const documentTypes = ["WIR", "SHD", "MIR", "MIA", "DS", "DT"];

type Template = {
  template_id: string;
  template_name: string;
  template_version: string | null;
  template_file_path: string | null;
  is_active: boolean;
  document_type_code: string;
  network_code: string;
  network_name: string;
};

type Project = { project_id: string; project_code: string; project_name: string };
type Network = { network_id: string; network_code: string; network_name: string };
type DocumentType = { document_type_id: string; type_code: string; type_name: string };

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [project, setProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ typeId: "", networkId: "", name: "", version: "1.0", file: null as File | null });

  const projectId = "ee505976-e729-4771-a0e7-4de2a8a32596";

  async function loadTemplateData() {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.rpc("get_template_management_data", { p_project_id: projectId });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const payload = data as { project: Project; document_types: DocumentType[]; networks: Network[]; templates: Template[] };
    setProject(payload.project);
    setTypes(payload.document_types || []);
    setNetworks(payload.networks || []);
    setTemplates(payload.templates || []);
    setLoading(false);
  }

  useEffect(() => { loadTemplateData(); }, []);

  async function addTemplate() {
    setMessage("");
    if (!form.typeId || !form.networkId || !form.name.trim() || !form.file) {
      setMessage("Select Document Type, Network, Template Name and file.");
      return;
    }

    const safeName = form.file.name.replace(/[^a-zA-Z0-9._()-]/g, "_");
    const path = `${projectId}/${types.find(t => t.document_type_id === form.typeId)?.type_code}/${networks.find(n => n.network_id === form.networkId)?.network_code}/${safeName}`;

    setLoading(true);
    const upload = await supabase.storage.from("document-templates").upload(path, form.file, {
      upsert: false,
      contentType: form.file.type || "application/octet-stream",
    });
    if (upload.error) {
      setMessage(upload.error.message);
      setLoading(false);
      return;
    }

    const typeCode = types.find(t => t.document_type_id === form.typeId)?.type_code || "";
    const networkCode = networks.find(n => n.network_id === form.networkId)?.network_code || "";
    const { error } = await supabase.rpc("upsert_template_record", {
      p_project_id: projectId,
      p_document_type_id: form.typeId,
      p_network_id: form.networkId,
      p_template_code: networkCode,
      p_template_name: form.name.trim(),
      p_template_version: form.version.trim() || "1.0",
      p_template_file_path: path,
    });

    if (error) {
      await supabase.storage.from("document-templates").remove([path]);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setForm({ typeId: "", networkId: "", name: "", version: "1.0", file: null });
    setMessage(`${typeCode} / ${networkCode} template added successfully.`);
    await loadTemplateData();
  }

  async function toggleTemplate(item: Template) {
    setMessage("");
    const { error } = await supabase.rpc("set_template_active", { p_template_id: item.template_id, p_is_active: !item.is_active });
    if (error) setMessage(error.message);
    else await loadTemplateData();
  }

  const stats = useMemo(() => {
    const count = (code: string) => templates.filter(t => t.document_type_code === code).length;
    return documentTypes.map(type => ({ type, count: count(type) }));
  }, [templates]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-slate-900 text-white p-5">
          <h1 className="text-xl font-bold mb-1">DOCUMENT CONTROL</h1>
          <p className="text-xs text-slate-400 mb-8">Jeddah Heights Infrastructure</p>
          <nav className="space-y-2">
            {["Dashboard", "Create Document", "Central Search", "Revision Control", "Reports", "Templates", "Users & Security", "Audit Log"].map(item => (
              <button key={item} onClick={() => setActive(item)} className={`w-full text-left px-4 py-3 rounded-lg transition ${active === item ? "bg-blue-600" : "hover:bg-slate-800"}`}>{item}</button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <header className="mb-8">
            <h2 className="text-3xl font-bold">{active}</h2>
            <p className="text-slate-500 mt-1">{project?.project_name || "Integrated Document Control System"}</p>
          </header>

          {active === "Templates" ? (
            <TemplateManager
              form={form}
              setForm={setForm}
              types={types}
              networks={networks}
              templates={templates}
              loading={loading}
              message={message}
              addTemplate={addTemplate}
              toggleTemplate={toggleTemplate}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <Stat title="Total Templates" value={String(templates.length)} />
                <Stat title="Active Templates" value={String(templates.filter(t => t.is_active).length)} />
                <Stat title="Document Types" value={String(types.length || documentTypes.length)} />
                <Stat title="Networks" value={String(networks.length)} />
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-5">Document Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {stats.map(x => <div key={x.type} className="border rounded-xl p-5 text-center"><div className="text-2xl font-bold text-blue-600">{x.type}</div><div className="text-sm text-slate-500 mt-2">{x.count} Templates</div></div>)}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function TemplateManager({ form, setForm, types, networks, templates, loading, message, addTemplate, toggleTemplate }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold">Add Project Template</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">Upload the original Excel form. It remains an internal template; users will not edit the Excel file.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Document Type" value={form.typeId} onChange={(v: string) => setForm({ ...form, typeId: v })} options={types.map((x: DocumentType) => ({ value: x.document_type_id, label: `${x.type_code} — ${x.type_name}` }))} />
          <Select label="Network" value={form.networkId} onChange={(v: string) => setForm({ ...form, networkId: v })} options={networks.map(x => ({ value: x.network_id, label: `${x.network_code} — ${x.network_name}` }))} />
          <label className="text-sm font-medium">Template Name<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SHD General Form" /></label>
          <label className="text-sm font-medium">Version<input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></label>
          <label className="md:col-span-2 text-sm font-medium">Excel Form<input className="mt-1 w-full border rounded-lg px-3 py-2" type="file" accept=".xlsx,.xlsm" onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} /></label>
        </div>
        <button disabled={loading} onClick={addTemplate} className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50">{loading ? "Saving..." : "Upload & Add Template"}</button>
        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5"><h3 className="text-xl font-semibold">Project Templates</h3><span className="text-sm text-slate-500">{templates.length} templates</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Type</th><th>Network</th><th>Template</th><th>Version</th><th>Status</th><th></th></tr></thead>
            <tbody>{templates.map((item: Template) => <tr key={item.template_id} className="border-b last:border-0"><td className="py-3 font-semibold">{item.document_type_code}</td><td>{item.network_code}</td><td>{item.template_name}</td><td>{item.template_version || "—"}</td><td><span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.is_active ? "Active" : "Inactive"}</span></td><td className="text-right"><button onClick={() => toggleTemplate(item)} className="text-blue-600 hover:underline">{item.is_active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody>
          </table>
          {!templates.length && <p className="py-8 text-center text-slate-500">No templates configured for this project.</p>}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <label className="text-sm font-medium">{label}<select className="mt-1 w-full border rounded-lg px-3 py-2 bg-white" value={value} onChange={e => onChange(e.target.value)}><option value="">Select...</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-sm text-slate-500">{title}</p><p className="text-3xl font-bold mt-2">{value}</p></div>;
}
