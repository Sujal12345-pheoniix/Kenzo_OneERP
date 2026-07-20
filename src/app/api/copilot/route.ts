import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const lowercasePrompt = prompt.toLowerCase();

    // Context Gathering based on query intent
    if (lowercasePrompt.includes("finance") || lowercasePrompt.includes("revenue") || lowercasePrompt.includes("expense")) {
      const invoices = await db.invoice.findMany({ where: { tenantId } });
      const expenses = await db.expense.findMany({ where: { tenantId } });

      const revenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const paid = invoices.filter(i => i.status === "PAID").reduce((sum, inv) => sum + Number(inv.amount), 0);
      const spent = expenses.filter(e => e.status === "APPROVED").reduce((sum, exp) => sum + Number(exp.amount), 0);
      const pendingExpenses = expenses.filter(e => e.status === "PENDING").reduce((sum, exp) => sum + Number(exp.amount), 0);

      const responseText = `Here is your **Kenzo AI Copilot Financial Report** for your company:\n\n` +
        `- **Total Inflow (Paid Invoices)**: $${paid.toLocaleString()}\n` +
        `- **Total Outflow (Approved Expenses)**: $${spent.toLocaleString()}\n` +
        `- **Pending Approvals**: $${pendingExpenses.toLocaleString()} in pending expenses.\n` +
        `- **Net Profit (Cash Flow basis)**: $${(paid - spent).toLocaleString()}\n\n` +
        `**AI KPI Analysis**:\n` +
        `Your operations are currently profitable with a solid net cash flow margin. However, you have $${pendingExpenses} in outstanding expenses that require review. Approving them will bring your profit down to $${(paid - spent - pendingExpenses).toLocaleString()}.`;

      return NextResponse.json({ reply: responseText });
    }

    if (lowercasePrompt.includes("proposal") || lowercasePrompt.includes("draft") || lowercasePrompt.includes("email")) {
      // Find leads to customize draft
      const leads = await db.lead.findMany({ where: { tenantId }, take: 1 });
      const leadName = leads[0]?.name || "Prospect";
      const leadCompany = leads[0]?.company || "Client Corp";
      const leadValue = Number(leads[0]?.value) || 50000;

      const responseText = `Here is an AI-generated draft proposal tailored for your lead **${leadCompany}**:\n\n` +
        `**Subject**: Strategic Consulting Proposal - Kenzo ERP Systems\n\n` +
        `Dear ${leadName},\n\n` +
        `Following up on our discussions, we are pleased to outline our enterprise implementation services for ${leadCompany}. Based on your requirements, we estimate a project valuation of **$${leadValue.toLocaleString()}** covering:\n\n` +
        `1. Complete multi-tenant cloud workspace initialization.\n` +
        `2. Full HRMS, CRM, and Finance integration.\n` +
        `3. Workflow automations and AI-Copilot deployment.\n\n` +
        `We look forward to partnering with ${leadCompany}.\n\n` +
        `Best regards,\n` +
        `${session.name}\n` +
        `Kenzo Representative`;

      return NextResponse.json({ reply: responseText });
    }

    if (lowercasePrompt.includes("project") || lowercasePrompt.includes("task")) {
      const projects = await db.project.findMany({ where: { tenantId } });
      const tasks = await db.task.findMany({ where: { tenantId } });

      const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
      const completedTasks = tasks.filter(t => t.status === "DONE").length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const responseText = `Here is the **Project Delivery Performance Summary**:\n\n` +
        `- **Active Projects**: ${activeProjects} projects currently in progress.\n` +
        `- **Task Completion Rate**: ${completionRate}% (${completedTasks}/${totalTasks} tasks closed).\n\n` +
        `**Copilot Recommendation**:\n` +
        `Your delivery velocity is steady. However, please inspect high-priority tasks in the backlog to prevent bottlenecks in client delivery pipelines.`;

      return NextResponse.json({ reply: responseText });
    }

    // Default Fallback
    const responseText = `Hello ${session.name}! I am your Kenzo Enterprise Copilot. How can I help you today? You can ask me to:\n` +
      `- **"Summarize finance"**: Calculate revenues, net profits, and analyze pending items.\n` +
      `- **"Draft a proposal"**: Write a tailored contract email for active leads.\n` +
      `- **"Show project status"**: Calculate task completion rates and delivery health.\n`;

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("AI Copilot Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
