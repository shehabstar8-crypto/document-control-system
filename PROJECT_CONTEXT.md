# DOCUMENT CONTROL SYSTEM — PROJECT CONTEXT

## Purpose
Integrated web-based Document Control System for Jeddah Heights Infrastructure. The web app is the user interface; official Excel forms are internal templates used by the system in the background. Users should NOT have to open, edit, or download Excel to create documents.

## Supported document types
WIR, SHD, MIR, MIA, DS, DT.

## Networks
GEN General; POT Potable Water; PWR Power; ROD Road; SEW Sewer; STL Street Lighting; STR Storm; TEL Telecommunication; IRR Irrigation; IPC Interim Payment Certificate (visible ONLY for DT). Do not invent additional network codes.

## Core workflow
Create Document -> Document Type -> Network -> Form -> Numbering Mode -> document data -> validation -> Generate Preview -> Create -> save internal Excel/template data -> Log/DB -> PDF -> View/Download/Print.
Generate Preview MUST NOT consume a sequence. Sequence is consumed only by successful Create.

## Numbering
Source coding vocabulary: Project Code -> Package -> From -> To -> Document Type -> Network -> Zone -> Serial -> Revision.
Known project code: JHD-INF-SSS-KAA.
Verified example: JHD-INF-SSS-KAA-SHD-GEN-V1-0015-0.
Current SHD GEN sequence was 14 before the last confirmed test state; repeated Preview calls did not advance it. Do not consume production sequence numbers casually.

Modes are fixed across document types:
- Next: new document/new sequence; Preview does not advance; Create does.
- Sub: existing document revision; same base sequence, revision increments.
- Manual: user changes Sequence and Revision only; never type a complete number.
Sub/Manual are not fully implemented; do not invent rules.

Active pattern: {PROJECT}-{PACKAGE}-{FROM}-{TO}-{TYPE}-{NETWORK}-{ZONE}-{SEQ}-{REV}. From/To may be derived from project code when rule components are null.
Do not invent generic per-type numbering rules without source evidence.

## SHD form rules
Contractor inputs: Document Number, Submission Date, Attachments/Drawings (Drawing No. + Drawing Name), Contractor Comments, Project Manager Name.
Defaults: Submission Date=today; comments="مرفق لكم عدد (X) لوحات A3" where X is entered attachment count; PM="م/ أحمد سمير". Zone is project-specific; do not hardcode a universal list.

Verified official SHD-GEN XLSM mapping:
- Document Number: J11:M11
- Submission Date: J12:M12
- Drawing No.: B20:H20
- Drawing Name: I20:N20
- Contractor comments: A32:M34
- Project Manager: C49:E49
The XLSM contains VBA. Preserve original orientation, merged cells, formatting, VBA and layout.

## Excel/PDF architecture
Official Excel templates are internal system assets. Never expose an Excel editing workflow to users.
Resolve active template by Type + Network (+ project), copy master to temporary working copy, populate in background, preserve fidelity, render PDF, never overwrite master. User-facing output should be View PDF, Download PDF, Print.
Do not assume openpyxl is sufficient for XLSM fidelity without testing.

## Templates
Templates are configuration-driven and versioned. Template Management must allow official forms to be added from the application. Never blindly overwrite master templates. Missing Type+Network templates must be verified against source forms before declaring them unavailable.

## Database
Core tables include:
companies, projects, networks, document_types, templates, template_fields, field_definitions, documents, document_revisions, document_items, document_files, storage_locations, statuses, status_transitions, workflows, workflow_steps, delay_rules, revision_rules, numbering_rules, numbering_rule_components, roles, users, permissions, role_permissions, audit_events, relationship_types, document_relationships, data_sources, import_mappings, document_field_values.

Important RPCs:
get_template_management_data, get_template_fields, preview_document_number, preview_next_document_number, preview_next_document_sequence, create_document_next, save_document_form_data, upsert_template_record.
There are historical overloaded numbering functions. Inspect actual signatures before changes.

## Repo
GitHub: shehabstar8-crypto/document-control-system
Branch: main
Main app: app/src/app/page.tsx, app/src/app/create/page.tsx, app/src/lib/supabase.ts.
Verify routing/current code before assuming which Create implementation is active.

## Supabase
Project ref: iwshxeqbxdirqeinxzem
Project data ID: ee505976-e729-4771-a0e7-4de2a8a32596
Region: ap-northeast-2.

## Current development state
The application is now PRIVATE and Owner-only. Authorized owner email: shehab.star8@gmail.com. Supabase Auth + database RLS + RPC grants + Storage policies must reject anonymous users and authenticated users whose email is not the owner. Do not restore open-access unless the owner explicitly requests it.

## Critical rules
- User enters data in web app, not Excel.
- Do not build Excel output UI.
- Do not change official template orientation/direction.
- Do not use rejected test Excel as production.
- Do not consume sequences for Preview testing.
- Do not invent missing business rules.
- Keep project/company-specific configuration data-driven.
- Inspect Supabase function signatures/definitions before DB changes.
- Inspect actual templates before modifying mappings.
- Prefer small safe changes and verify build/DB.
- Never claim a test passed unless actually executed.

## Known unfinished work
1. Sub numbering.
2. Manual numbering.
3. Project-specific Zone configuration.
4. Align template fields with actual contractor inputs/required validation.
5. Complete official Type+Network template coverage.
6. Robust XLSM/VBA-preserving generation.
7. PDF generation + View/Download/Print.
8. Central Search, Revision Control, Reports, Audit Log, Users & Security.
9. Status/workflow + Delay rules.
10. Production security hardening beyond the current Owner-only gate (e.g. broader role model, SSR auth refresh, audit/security review) later, explicitly.

## Codex workflow
Before non-trivial changes: read this file; inspect relevant code; inspect Supabase schema/function signatures when DB behavior is involved; make the smallest safe change; run build/tests when possible; report exactly what changed and what was verified. If a request conflicts with this file, ask the owner before changing the rule.
