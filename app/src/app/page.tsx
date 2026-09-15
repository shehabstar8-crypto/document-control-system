"use client";

import { useState } from "react";

const documentTypes = ["WIR", "SHD", "MIR", "MIA", "DS", "DT"];

export default function Home() {
  const [active, setActive] = useState("Dashboard");

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white p-5">
          <h1 className="text-xl font-bold mb-1">
            DOCUMENT CONTROL
          </h1>

          <p className="text-xs text-slate-400 mb-8">
            Jeddah Heights Infrastructure
          </p>

          <nav className="space-y-2">
            {[
              "Dashboard",
              "Create Document",
              "Central Search",
              "Revision Control",
              "Reports",
              "Templates",
              "Users & Security",
              "Audit Log",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  active === item
                    ? "bg-blue-600"
                    : "hover:bg-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <section className="flex-1 p-8">
          <header className="mb-8">
            <h2 className="text-3xl font-bold">{active}</h2>
            <p className="text-slate-500 mt-1">
              Integrated Document Control System
            </p>
          </header>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Stat title="Total Documents" value="0" />
            <Stat title="Open" value="0" />
            <Stat title="Pending" value="0" />
            <Stat title="Delayed" value="0" />
          </div>

          {/* Document Types */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-5">
              Document Types
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {documentTypes.map((type) => (
                <button
                  key={type}
                  className="border rounded-xl p-5 text-center hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {type}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    0 Documents
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}