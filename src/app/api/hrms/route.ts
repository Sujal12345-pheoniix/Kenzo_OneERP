import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// In-memory recruitment candidate store with pre-populated realistic applications
let jobApplicationsStore: any[] = [
  {
    id: "app-101",
    candidateName: "Rohan Verma",
    email: "rohan.verma@example.com",
    position: "Senior Full-Stack Engineer",
    experience: "5+ Years",
    status: "SHORTLISTED",
    appliedDate: "2026-07-18",
    resumeSummary: "Expert in Next.js, React, Node.js, PostgreSQL, and Microservices. Built scalable enterprise SaaS apps with 99.99% uptime.",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
    coverNote: "Passionate about building high-performance enterprise systems. Excited about Kenzo OneERP's AI copilot capabilities.",
  },
  {
    id: "app-102",
    candidateName: "Priya Sharma",
    email: "priya.sharma@example.com",
    position: "Business & Sales Head",
    experience: "7+ Years",
    status: "INTERVIEW_SCHEDULED",
    appliedDate: "2026-07-19",
    resumeSummary: "Proven track record in B2B enterprise sales, territory management, and revenue growth. Closed Rs. 1.2 Cr in ARR in 2025.",
    skills: ["B2B Sales", "Key Account Management", "CRM Pipeline", "Negotiation", "Team Leadership"],
    coverNote: "Looking forward to expanding Kenzo OneERP's market presence across corporate accounts in India.",
  },
  {
    id: "app-103",
    candidateName: "Amitabh Malhotra",
    email: "amitabh.m@example.com",
    position: "UI/UX Product Designer",
    experience: "4+ Years",
    status: "NEW",
    appliedDate: "2026-07-20",
    resumeSummary: "Figma design systems lead. Specialist in modern dark-mode dashboards, glassmorphism UI, and accessibility standards.",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Tailwind CSS"],
    coverNote: "Love creating wow-factor visual designs for enterprise ERP portals.",
  },
  {
    id: "app-104",
    candidateName: "Neha Gupta",
    email: "neha.gupta@example.com",
    position: "HR Operations Specialist",
    experience: "3+ Years",
    status: "HIRED",
    appliedDate: "2026-07-15",
    resumeSummary: "HR Generalist with expertise in payroll management, employee onboarding, compliance, and performance evaluations.",
    skills: ["Payroll", "HRMS", "Onboarding", "Statutory Compliance", "Employee Engagement"],
    coverNote: "Excited to optimize HR operations and employee satisfaction.",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ applications: jobApplicationsStore });
  } catch (error) {
    console.error("Job Applications GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { candidateName, email, position, experience, resumeSummary, skills, coverNote } = body;

    if (!candidateName || !email || !position) {
      return NextResponse.json({ error: "Missing candidate name, email, or position." }, { status: 400 });
    }

    const newApp = {
      id: `app-${Date.now()}`,
      candidateName,
      email,
      position,
      experience: experience || "1+ Year",
      status: "NEW",
      appliedDate: new Date().toISOString().split("T")[0],
      resumeSummary: resumeSummary || "Candidate application profile submitted via HR portal.",
      skills: Array.isArray(skills) ? skills : ["General Operations"],
      coverNote: coverNote || "Application submitted for review.",
    };

    jobApplicationsStore.unshift(newApp);
    return NextResponse.json({ success: true, application: newApp });
  } catch (error) {
    console.error("Job Applications POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing application ID or status." }, { status: 400 });
    }

    const idx = jobApplicationsStore.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    jobApplicationsStore[idx].status = status;
    return NextResponse.json({ success: true, application: jobApplicationsStore[idx] });
  } catch (error) {
    console.error("Job Applications PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
