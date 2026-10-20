# GEDPro — Demo Accounts & Profiles Reference

> **API Base URL:** [http://localhost:3101](http://localhost:3101)  
> **API Docs / Swagger:** [http://localhost:3101/api/docs](http://localhost:3101/api/docs)  
> **MinIO Console (Document Storage):** [http://localhost:9001](http://localhost:9001) *(User: `gedpro_minio` / Pass: `gedpro_minio_password`)*  
> **Database:** PostgreSQL on `localhost:5432` (`gedpro_db`)

---

## 1. Authentication Credentials Summary

All passwords adhere to the enterprise security policy (minimum 12 characters).

| Role | Name | Email | Password | Scope & Responsibilities |
|---|---|---|---|---|
| **Administrator** | Admin GEDPro | `admin@gedpro.com` | `Admin12345678!` | Full system administration, audit logs, AI monitoring, role assignments |
| **Recruiter (RH) 1** | Sarah Jenkins | `recruiter.sarah@gedpro.com` | `Recruiter1234!` | Lead Recruiter: pipeline management, candidate communications, interview scheduling |
| **Recruiter (RH) 2** | Youssef Berrada | `recruiter.youssef@gedpro.com` | `Recruiter1234!` | Technical Recruiter: sourcing, evaluation forms, candidate stage transitions |
| **Hiring Manager 1** | Karim Tazi | `tech.lead@gedpro.com` | `Manager123456!` | Engineering Hiring Manager: scorecard evaluations, technical interview notes |
| **Hiring Manager 2** | Nadia Benkirane | `hr.lead@gedpro.com` | `Manager123456!` | People & Operations Manager: cultural fit evaluation, offer approvals |
| **Candidate (Demo)** | Abdelilah Ajjouqa | `candidate@gedpro.com` | `Candidate1234!` | Candidate Portal: application status tracking, document uploads |

---

## 2. Published Job Openings & Pipelines

| Job Title | Department | Location | Pipeline | Open Applications |
|---|---|---|---|---|
| **Senior Full-Stack Engineer (NestJS / React)** | Engineering | Casablanca / Hybrid | Standard Engineering Pipeline | 2 Candidates (Technical Assessment & Offer) |
| **Product Marketing Lead** | Marketing & Growth | Remote | Commercial & Operations Pipeline | 1 Candidate (HR Screening) |
| **DevOps & Cloud Architect (AWS / K8s)** | Infrastructure | Casablanca | Standard Engineering Pipeline | 1 Candidate (Phone Screen) |
| **HR & People Operations Specialist** | Human Resources | Rabat / On-site | Commercial & Operations Pipeline | 1 Candidate (Executive Offer) |

---

## 3. Seeded Candidates & Ingested CVs

All candidates are linked to real PDF CVs stored in MinIO storage (`gedpro-documents` bucket):

| Candidate Name | Email | Target Job | Current Stage | Linked CV Document |
|---|---|---|---|---|
| **Abdelilah Ajjouqa** | `candidate@gedpro.com` | Senior Full-Stack Engineer | Offer Extended | `Abdelilah_Ajjouqa_CV_Fr.pdf` |
| **Salma Mansouri** | `salma.marketing@example.com` | Product Marketing Lead | HR Screening | `CV A4 Professionnel Marketing Noir et Blanc.pdf` |
| **Mehdi El Amrani** | `mehdi.devops@example.com` | DevOps & Cloud Architect | Phone Screen | `CV Français Professionnel Simple Noir et Blanc (1).pdf` |
| **Zineb Chraibi** | `zineb.frontend@example.com` | Senior Full-Stack Engineer | Technical Assessment | `CV Français Professionnel Simple Noir et Blanc.pdf` |
| **Omar Bennani** | `omar.hr@example.com` | HR & People Operations Specialist | Executive Offer | `CV Professionnel Ressources Humaines Marron et Blanc.pdf` |
