# Rate-My-Resume. [Live View](https://rateresume.netlify.app/)
# 🚀 Rate My Resume — AI-Powered Resume Analyzer

An intelligent resume analysis web application that helps users evaluate their CV/resume instantly with a professional score, ATS-friendly feedback, and actionable improvement suggestions.

Built with **Netlify**, **Serverless Functions**, **PostgreSQL**, and **AI-powered analysis**, this project demonstrates a practical full-stack AI application that combines document parsing, resume scoring, database persistence, and production deployment.

---

## 🌟 Project Overview

**Rate My Resume** is a modern web application where users can upload their resume in **PDF or DOCX format** and receive a structured analysis of its quality, readability, ATS compatibility, and professional impact.

The application is designed for job seekers, students, graduates, and professionals who want quick, meaningful feedback before applying for jobs, internships, or academic opportunities.

---

## ✨ Key Features

- 📄 **PDF and DOCX Resume Upload**
- 🤖 **AI-Based Resume Analysis**
- 📊 **Overall Resume Score**
- 🧠 **ATS Compatibility Feedback**
- 🎯 **Skill, Experience, Education, and Project Evaluation**
- 📝 **Actionable Suggestions for Improvement**
- 🗂️ **PostgreSQL Database Integration**
- ☁️ **Netlify Deployment Ready**
- 🔐 **Environment Variable Based Secret Management**
- ⚡ **Serverless Backend with Netlify Functions**
- 🧩 **Fallback-Friendly Architecture for Future AI Providers**

---

## 🧠 What the App Evaluates

The resume analysis is structured around important hiring and ATS factors, including:

- Resume structure and formatting
- Clarity of professional summary
- Skills relevance
- Work experience quality
- Project descriptions
- Education section
- Keyword optimisation
- ATS readability
- Strength of achievements
- Missing or weak sections

The final output provides both a **score** and **specific feedback** so users can improve their resume before submitting applications.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React / Vite |
| Backend | Netlify Serverless Functions |
| AI Analysis | OpenAI API |
| Database | PostgreSQL |
| Hosting | Netlify |
| File Processing | PDF / DOCX text extraction |
| Environment Management | Netlify Environment Variables |

---

## 🏗️ System Architecture

```txt
User Uploads Resume
        ↓
Frontend receives PDF/DOCX file
        ↓
Netlify Function processes request
        ↓
Resume text is extracted
        ↓
AI model analyzes resume content
        ↓
Structured JSON feedback is generated
        ↓
Result is saved to PostgreSQL database
        ↓
User receives score and improvement suggestions
