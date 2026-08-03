import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('docx_assets', exist_ok=True)

# Set global style
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# 1. ARCHITECTURE DIAGRAM
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

# Title
ax.text(5, 5.6, "Kenzo OneERP (KORE) - Full Stack System Architecture", 
        fontsize=14, fontweight='bold', ha='center', color='#0f172a')

# Boxes
boxes = [
    ("Client Browser\n(Next.js React Client)", 0.5, 3.5, 2.2, 1.2, '#0ea5e9', '#e0f2fe'),
    ("Next.js App Router\n(Server Components & API Routes)", 3.8, 3.5, 2.5, 1.2, '#6366f1', '#e0e7ff'),
    ("Auth Engine\n(JWT + Cookies + Bcrypt)", 3.8, 1.5, 2.5, 1.2, '#8b5cf6', '#f3e8ff'),
    ("Prisma ORM Layer\n(Schema & Client)", 7.2, 3.5, 2.3, 1.2, '#10b981', '#d1fae5'),
    ("Neon PostgreSQL\n(Cloud Database)", 7.2, 1.5, 2.3, 1.2, '#059669', '#ecfdf5'),
    ("Cloudinary CDN\n(Signed Image Uploads)", 0.5, 1.5, 2.2, 1.2, '#f59e0b', '#fef3c7'),
]

for title, x, y, w, h, border, fill in boxes:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", 
                                  ec=border, fc=fill, lw=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', 
            fontsize=9, fontweight='bold', color='#0f172a')

# Arrows
arrows = [
    (2.8, 4.1, 3.7, 4.1, "HTTPS / JSON"),
    (6.4, 4.1, 7.1, 4.1, "Prisma Queries"),
    (8.35, 3.4, 8.35, 2.8, "SQL Queries"),
    (5.05, 3.4, 5.05, 2.8, "Token Auth"),
    (2.8, 2.1, 3.7, 2.1, "Base64 / Signed Signature"),
]

for x1, y1, x2, y2, label in arrows:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color='#475569', lw=1.5))
    ax.text((x1+x2)/2, (y1+y2)/2 + 0.15, label, ha='center', va='bottom', 
            fontsize=8, color='#334155', fontweight='semibold')

plt.tight_layout()
plt.savefig('docx_assets/arch_diagram.png', bbox_inches='tight')
plt.close()

# 2. DATA FLOW DIAGRAM (DFD Level 1)
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis('off')

ax.text(5, 4.6, "Data Flow Diagram (DFD Level 1) - Leave Application & Real-time Approval Flow", 
        fontsize=13, fontweight='bold', ha='center', color='#0f172a')

nodes = [
    ("Employee User", 0.5, 2.8, 1.8, 1.0, '#0ea5e9', '#e0f2fe'),
    ("Leave API Endpoint\n(/api/leaves)", 3.2, 2.8, 2.2, 1.0, '#6366f1', '#e0e7ff'),
    ("PostgreSQL DB\n(Leave Table)", 6.2, 2.8, 1.8, 1.0, '#10b981', '#d1fae5'),
    ("Admin / CEO / HR\nDashboard", 3.2, 0.6, 2.2, 1.0, '#ec4899', '#fce7f3'),
]

for title, x, y, w, h, border, fill in nodes:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=fill, lw=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0f172a')

# Flow arrows
ax.annotate("", xy=(3.1, 3.3), xytext=(2.4, 3.3), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.5))
ax.text(2.75, 3.45, "Submit Leave", ha='center', fontsize=7.5, color='#0369a1')

ax.annotate("", xy=(6.1, 3.3), xytext=(5.5, 3.3), arrowprops=dict(arrowstyle="->", color='#4338ca', lw=1.5))
ax.text(5.8, 3.45, "Write PENDING", ha='center', fontsize=7.5, color='#3730a3')

ax.annotate("", xy=(4.3, 1.7), xytext=(4.3, 2.7), arrowprops=dict(arrowstyle="->", color='#d97706', lw=1.5))
ax.text(4.9, 2.2, "Real-time Poll / Push", ha='center', fontsize=7.5, color='#b45309')

ax.annotate("", xy=(5.5, 1.1), xytext=(6.2, 2.7), arrowprops=dict(arrowstyle="->", color='#be185d', lw=1.5))
ax.text(6.1, 1.8, "Update APPROVED / REJECTED", ha='center', fontsize=7.5, color='#9d174d')

plt.tight_layout()
plt.savefig('docx_assets/dfd_level1.png', bbox_inches='tight')
plt.close()

# 3. LEAVE WORKFLOW
fig, ax = plt.subplots(figsize=(9, 4), dpi=300)
ax.set_xlim(0, 9)
ax.set_ylim(0, 4)
ax.axis('off')

ax.text(4.5, 3.6, "Leave State Lifecycle & Real-Time Isolation Matrix", 
        fontsize=12, fontweight='bold', ha='center', color='#0f172a')

steps = [
    ("1. Apply Leave\n(Employee Fill Form)", 0.4, 1.8, 1.8, 1.0, '#3b82f6', '#dbeafe'),
    ("2. Status = PENDING\n(Scoped to Tenant)", 2.6, 1.8, 1.8, 1.0, '#f59e0b', '#fef3c7'),
    ("3. Role Filter\n(Admin/CEO/HR See All)", 4.8, 1.8, 1.8, 1.0, '#8b5cf6', '#f3e8ff'),
    ("4. Decision\nAPPROVED / REJECTED", 7.0, 1.8, 1.8, 1.0, '#10b981', '#d1fae5'),
]

for title, x, y, w, h, border, fill in steps:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=fill, lw=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=8, fontweight='bold', color='#0f172a')

for i in range(len(steps)-1):
    x1 = steps[i][1] + steps[i][3] + 0.1
    x2 = steps[i+1][1] - 0.1
    ax.annotate("", xy=(x2, 2.3), xytext=(x1, 2.3), arrowprops=dict(arrowstyle="->", color='#64748b', lw=1.5))

plt.tight_layout()
plt.savefig('docx_assets/leave_workflow.png', bbox_inches='tight')
plt.close()

# 4. DATABASE ERD DIAGRAM
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

ax.text(5, 5.6, "Database Entity Relationship Diagram (ERD)", 
        fontsize=13, fontweight='bold', ha='center', color='#0f172a')

entities = [
    ("Tenant (1)", 4.0, 4.3, 2.0, 0.9, '#0ea5e9', '#e0f2fe'),
    ("User (N)", 1.0, 2.8, 1.8, 0.9, '#6366f1', '#e0e7ff'),
    ("Employee (N)", 3.8, 2.8, 2.4, 0.9, '#10b981', '#d1fae5'),
    ("Project (N)", 7.2, 2.8, 1.8, 0.9, '#f59e0b', '#fef3c7'),
    ("Leave (N)", 1.0, 0.8, 1.8, 0.9, '#ec4899', '#fce7f3'),
    ("Attendance (N)", 3.2, 0.8, 2.0, 0.9, '#8b5cf6', '#f3e8ff'),
    ("Task (N)", 5.6, 0.8, 1.8, 0.9, '#14b8a6', '#ccfbf1'),
    ("Invoice/Expense", 7.8, 0.8, 2.0, 0.9, '#f43f5e', '#ffe4e6'),
]

for title, x, y, w, h, border, fill in entities:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=fill, lw=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0f172a')

# Lines connecting tenant to all
connections = [
    ((5.0, 4.2), (1.9, 3.8)),
    ((5.0, 4.2), (5.0, 3.8)),
    ((5.0, 4.2), (8.1, 3.8)),
    ((5.0, 2.7), (1.9, 1.8)),
    ((5.0, 2.7), (4.2, 1.8)),
    ((5.0, 2.7), (6.5, 1.8)),
    ((8.1, 2.7), (8.8, 1.8)),
]

for (x1, y1), (x2, y2) in connections:
    ax.plot([x1, x2], [y1, y2], color='#94a3b8', linestyle='--', lw=1.2)

plt.tight_layout()
plt.savefig('docx_assets/erd_diagram.png', bbox_inches='tight')
plt.close()

# 5. RBAC HIERARCHY PYRAMID
fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
ax.set_xlim(0, 8)
ax.set_ylim(0, 5)
ax.axis('off')

ax.text(4, 4.6, "Role-Based Access Control (RBAC) Hierarchy", 
        fontsize=13, fontweight='bold', ha='center', color='#0f172a')

levels = [
    ("SUPER_ADMIN & COMPANY_ADMIN (Full Tenant Control & Audit)", 0.8, 3.6, 6.4, 0.7, '#4338ca', '#e0e7ff'),
    ("CEO & CTO (Strategic Analytics, Pipeline & High Approvals)", 1.2, 2.7, 5.6, 0.7, '#0284c7', '#e0f2fe'),
    ("HR & FINANCE (Payroll, Attendance, Leaves & Expenses Board)", 1.6, 1.8, 4.8, 0.7, '#059669', '#d1fae5'),
    ("PROJECT_MANAGER & DEVELOPER & EMPLOYEE (Task & Personal Scoped)", 2.0, 0.9, 4.0, 0.7, '#d97706', '#fef3c7'),
]

for title, x, y, w, h, border, fill in levels:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=fill, lw=1.8)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=8, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig('docx_assets/rbac_hierarchy.png', bbox_inches='tight')
plt.close()

# 6. THEME ENGINE MATRIX
fig, ax = plt.subplots(figsize=(8, 4), dpi=300)
ax.set_xlim(0, 8)
ax.set_ylim(0, 4)
ax.axis('off')

ax.text(4, 3.6, "Theme & Text Contrast Engine Architecture", 
        fontsize=13, fontweight='bold', ha='center', color='#0f172a')

cards = [
    ("Light Mode\n- Slate Background (#f8fafc)\n- Crisp Slate Text (#0f172a)\n- White Inputs + Dark Placeholder", 0.5, 0.8, 3.2, 2.4, '#0ea5e9', '#f0f9ff'),
    ("Dark Mode & Profile Modal\n- Dark Slate Background (#060b17)\n- Pure White Typed Text (#ffffff)\n- Soft Slate Placeholder (#94a3b8)\n- Fixed .profile-modal-dark", 4.3, 0.8, 3.2, 2.4, '#6366f1', '#eef2ff'),
]

for title, x, y, w, h, border, fill in cards:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15", ec=border, fc=fill, lw=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0f172a')

plt.tight_layout()
plt.savefig('docx_assets/theme_engine.png', bbox_inches='tight')
plt.close()

print("All 6 visual diagrams successfully generated in docx_assets/")
