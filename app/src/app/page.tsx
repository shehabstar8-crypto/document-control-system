"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const PROJECT_ID = "ee505976-e729-4771-a0e7-4de2a8a32596";
const DOCUMENT_TYPES = ["WIR", "SHD", "MIR", "MIA", "DS", "DT"];

type Template = { template_id:string; template_name:string; template_version:string|null; template_file_path:string|null; is_active:boolean; document_type_code:string; network_code:string; network_name:string };
type Project = { project_id:string; project_code:string; project_name:string };
type Network = { network_id:string; network_code:string; network_name:string };
type DocumentType = { document_type_id:string; type_code:string; type_name:string };

export default function Home(){
 const [active,setActive]=useState("Dashboard");
 const [project,setProject]=useState<Project|null>(null);
 const [templates,setTemplates]=useState<Template[]>([]);
 const [networks,setNetworks]=useState<Network[]>([]);
 const [types,setTypes]=useState<DocumentType[]>([]);
 const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
 const [create,setCreate]=useState({typeId:"",networkId:"",zone:"",from:"NHC",to:"DAR",revision:"0"});
 const typeCode=types.find(x=>x.document_type_id===create.typeId)?.type_code||"";
 const networkCode=networks.find(x=>x.network_id===create.networkId)?.network_code||"";
 const availableNetworks=networks.filter(n=>typeCode!=="DT" ? n.network_code!=="IPC" : true);
 const activeTemplates=templates.filter(t=>t.is_active&&t.document_type_code===typeCode&&t.network_code===networkCode);
 const [preview,setPreview]=useState("");

 async function load(){setLoading(true);setMessage("");const {data,error}=await supabase.rpc("get_template_management_data",{p_project_id:PROJECT_ID});if(error){setMessage(error.message);setLoading(false);return;}const p=data as {project:Project;document_types:DocumentType[];networks:Network[];templates:Template[]};setProject(p.project);setTypes(p.document_types||[]);setNetworks(p.networks||[]);setTemplates(p.templates||[]);setLoading(false);}
 useEffect(()=>{load()},[]);
 useEffect(()=>{setCreate(c=>({...c,networkId:""}));setPreview("");},[create.typeId]);
 useEffect(()=>{setPreview("");},[create.networkId,create.zone,create.from,create.to,create.revision]);
 async function generate(){setMessage("");if(!typeCode||!networkCode){setMessage("Select Document Type and Network.");return;}if(!create.zone.trim()){setMessage("Zone is required.");return;}setLoading(true);const {data,error}=await supabase.rpc("preview_document_number",{p_project_id:PROJECT_ID,p_document_type_code:typeCode,p_network_code:networkCode,p_zone:create.zone.trim(),p_from_code:create.from.trim(),p_to_code:create.to.trim(),p_revision:create.revision.trim()||"0"});if(error)setMessage(error.message);else setPreview(String(data));setLoading(false);}

 return <main className="min-h-screen bg-slate-100 text-slate-900"><div className="flex min-h-screen">
  <aside className="w-64 bg-slate-900 text-white p-5"><h1 className="text-xl font-bold mb-1">DOCUMENT CONTROL</h1><p className="text-xs text-slate-400 mb-8">Jeddah Heights Infrastructure</p><nav className="space-y-2">{["Dashboard","Create Document","Central Search","Revision Control","Reports","Templates","Users & Security","Audit Log"].map(x=><button key={x} onClick={()=>setActive(x)} className={`w-full text-left px-4 py-3 rounded-lg ${active===x?"bg-blue-600":"hover:bg-slate-800"}`}>{x}</button>)}</nav></aside>
  <section className="flex-1 p-8"><header className="mb-8"><h2 className="text-3xl font-bold">{active}</h2><p className="text-slate-500 mt-1">{project?.project_name||"Integrated Document Control System"}</p></header>
   {active==="Templates"?<TemplateManager form={null} setForm={()=>{}} types={types} networks={networks} templates={templates} loading={loading} message={message} addTemplate={async()=>{}} toggleTemplate={async()=>{}}/>:active==="Create Document"?<CreateDocument create={create} setCreate={setCreate} typeCode={typeCode} networkCode={networkCode} networks={availableNetworks} types={types} templates={activeTemplates} preview={preview} loading={loading} message={message} generate={generate}/>:<Dashboard templates={templates} types={types} networks={networks}/>} 
  </section></div></main>;
}

function Dashboard({templates,types,networks}:{templates:Template[];types:DocumentType[];networks:Network[]}){return <><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"><Stat title="Total Templates" value={String(templates.length)}/><Stat title="Active Templates" value={String(templates.filter(t=>t.is_active).length)}/><Stat title="Document Types" value={String(types.length)}/><Stat title="Networks" value={String(networks.length)}/></div><div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-lg font-semibold mb-5">Document Types</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{DOCUMENT_TYPES.map(t=><div key={t} className="border rounded-xl p-5 text-center"><div className="text-2xl font-bold text-blue-600">{t}</div><div className="text-sm text-slate-500 mt-2">{templates.filter(x=>x.document_type_code===t).length} Templates</div></div>)}</div></div></>}

function CreateDocument({create,setCreate,typeCode,networkCode,networks,types,templates,preview,loading,message,generate}:any){return <div className="space-y-6"><div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-xl font-semibold">Create Document</h3><p className="text-sm text-slate-500 mt-1 mb-6">Select the coding components. Generate is preview-only and does not consume the serial.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Select label="Document Type" value={create.typeId} onChange={(v:string)=>setCreate({...create,typeId:v})} options={types.map((x:DocumentType)=>({value:x.document_type_id,label:`${x.type_code} — ${x.type_name}`}))}/><Select label="Network" value={create.networkId} onChange={(v:string)=>setCreate({...create,networkId:v})} options={networks.map((x:Network)=>({value:x.network_id,label:`${x.network_code} — ${x.network_name}`}))}/><Input label="Zone" value={create.zone} onChange={(v:string)=>setCreate({...create,zone:v})} placeholder="e.g. V4"/><Input label="From" value={create.from} onChange={(v:string)=>setCreate({...create,from:v.toUpperCase()})} placeholder="NHC"/><Input label="To" value={create.to} onChange={(v:string)=>setCreate({...create,to:v.toUpperCase()})} placeholder="DAR"/><Input label="Revision" value={create.revision} onChange={(v:string)=>setCreate({...create,revision:v})} placeholder="0"/></div><button disabled={loading} onClick={generate} className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50">{loading?"Generating...":"Generate Number"}</button>{message&&<p className="mt-4 text-sm text-red-600">{message}</p>}</div><div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-lg font-semibold">Document Number Preview</h3>{preview?<div className="mt-4 rounded-lg bg-slate-900 text-white p-5 text-xl font-mono tracking-wide">{preview}</div>:<p className="mt-4 text-slate-500">No number generated yet.</p>}<div className="mt-5 border-t pt-5"><p className="text-sm font-medium">Active Form</p>{templates.length?<div className="mt-2 text-sm">{templates[0].template_name} <span className="text-slate-500">(v{templates[0].template_version||"—"})</span></div>:typeCode&&networkCode?<div className="mt-2 text-sm text-amber-700">No active form configured for {typeCode} / {networkCode}.</div>:<div className="mt-2 text-sm text-slate-500">Select Type and Network.</div>}</div></div></div>}

function TemplateManager({types,networks,templates}:any){return <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-xl font-semibold">Templates</h3><p className="text-sm text-slate-500 mt-2">Template management remains available from the existing module.</p><div className="mt-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Type</th><th>Network</th><th>Template</th><th>Version</th><th>Status</th></tr></thead><tbody>{templates.map((x:Template)=><tr key={x.template_id} className="border-b"><td className="py-3 font-semibold">{x.document_type_code}</td><td>{x.network_code}</td><td>{x.template_name}</td><td>{x.template_version||"—"}</td><td>{x.is_active?"Active":"Inactive"}</td></tr>)}</tbody></table></div></div>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){return <label className="text-sm font-medium block">{label}<select className="mt-1 w-full border rounded-lg px-3 py-2 bg-white" value={value} onChange={e=>onChange(e.target.value)}><option value="">Select...</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
function Input({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}){return <label className="text-sm font-medium block">{label}<input className="mt-1 w-full border rounded-lg px-3 py-2" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
function Stat({title,value}:{title:string;value:string}){return <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-sm text-slate-500">{title}</p><p className="text-3xl font-bold mt-2">{value}</p></div>}
