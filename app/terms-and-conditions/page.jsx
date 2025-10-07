// pages/terms.jsx
"use client";
import React, { useState } from "react";
import {
  Mail,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  CreditCard,
  Users,
  Settings,
  Building,
  Globe,
  Scale,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Section = ({ title, children, badge, isActive, onActivate, id, icon }) => {
  return (
    <AccordionItem value={id} className="border-b border-gray-200">
      <AccordionTrigger
        className={`py-4 hover:no-underline group ${
          isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
        }`}
        onClick={onActivate}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex items-center gap-3">
            {icon}
            {badge && (
              <Badge variant="secondary" className="mr-2">
                {badge}
              </Badge>
            )}
            <span
              className={`text-lg font-semibold group-hover:text-blue-600 transition-colors ${
                isActive ? "text-blue-700" : "text-gray-800"
              }`}
            >
              {title}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 text-gray-700 leading-relaxed">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};

const Terms = () => {
  const [activeSection, setActiveSection] = useState("section-1");
  const [activeTab, setActiveTab] = useState("all");

  const sections = [
    {
      id: "section-1",
      title: "Introduction",
      badge: "Welcome",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "section-2",
      title: "About the Platform",
      badge: "Overview",
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "section-3",
      title: "Acceptance and Eligibility",
      badge: "Requirements",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "section-4",
      title: "Platform and Policy Compliance",
      badge: "Compliance",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "section-5",
      title: "Data Privacy, Storage, and Retention",
      badge: "Privacy",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "section-6",
      title: "Intellectual Property Rights",
      badge: "Legal",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "section-7",
      title: "Fees, Billing, and Taxes",
      badge: "Financial",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "section-8",
      title: "Prohibited Conduct",
      badge: "Restrictions",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "section-9",
      title: "Confidentiality",
      badge: "Legal",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "section-10",
      title: "Indemnification",
      badge: "Legal",
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: "section-11",
      title: "Limitation of Liability",
      badge: "Legal",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "section-12",
      title: "Termination & Suspension",
      badge: "Policy",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "section-13",
      title: "Modifications to Terms",
      badge: "Updates",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "section-14",
      title: "Governing Law & Jurisdiction",
      badge: "Legal",
      icon: <Building className="w-4 h-4" />,
    },
    {
      id: "section-15",
      title: "Force Majeure",
      badge: "Legal",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: "section-16",
      title: "Contact Information",
      badge: "Support",
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  const platformFeatures = [
    {
      feature: "Campaign Tracking",
      description: "CPA, CPL, CPI, CPS models",
      color: "bg-blue-100 text-blue-800",
    },
    {
      feature: "Performance Analytics",
      description: "Real-time insights and reporting",
      color: "bg-green-100 text-green-800",
    },
    {
      feature: "Creative Management",
      description: "Ad content optimization",
      color: "bg-purple-100 text-purple-800",
    },
    {
      feature: "Affiliate Tracking",
      description: "Publisher performance monitoring",
      color: "bg-orange-100 text-orange-800",
    },
    {
      feature: "Fraud Detection",
      description: "Advanced security measures",
      color: "bg-red-100 text-red-800",
    },
    {
      feature: "Cross-channel Attribution",
      description: "Multi-platform performance",
      color: "bg-indigo-100 text-indigo-800",
    },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              SGS Tracker Terms & Conditions
            </CardTitle>
            <p className="text-sm text-gray-600 max-w-3xl mx-auto">
              Welcome to SGS Tracker, an internal and partner-facing campaign tracking platform. 
              These Terms form a legally binding agreement governing access to and use of the SGS Tracker platform.
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 ">
            <Card className="sticky top-8 shadow-lg border-0 md:-ml-12 ">
              <CardHeader>
                <CardTitle className="text-xl">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-[230px]"
                >
                  <TabsList className="grid grid-cols-2 mb-4 gap-3 ">
                    <TabsTrigger value="all">All Sections</TabsTrigger>
                    <TabsTrigger value="features">Platform Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-1">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={
                          activeSection === section.id ? "secondary" : "ghost"
                        }
                        className={`w-full justify-start text-sm font-normal ${
                          activeSection === section.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : ""
                        }`}
                        onClick={() => handleSectionClick(section.id)}
                      >
                        <div className="flex items-center gap-1">
                          {section.icon}
                          <span>{section.title}</span>
                        </div>
                      </Button>
                    ))}
                  </TabsContent>

                  <TabsContent value="features" className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Platform Features
                    </h4>
                    {platformFeatures.map((feature) => (
                      <div
                        key={feature.feature}
                        className="p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-800 text-sm">
                            {feature.feature}
                          </span>
                        </div>
                        <Badge className={feature.color}>
                          {feature.description}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                {/* Key Feature Highlight */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">60-Day Data Retention</span>
                  </div>
                  <p className="text-xs text-green-700">
                    All campaign data is automatically deleted after 60 days. No personal data is stored.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <Accordion
                  type="single"
                  collapsible
                  value={activeSection}
                  onValueChange={setActiveSection}
                >
                  {/* 1. Introduction */}
                  <Section
                    title="Introduction"
                    badge="Welcome"
                    id="section-1"
                    isActive={activeSection === "section-1"}
                    onActivate={() => setActiveSection("section-1")}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Welcome to SGS Tracker, an internal and partner-facing campaign tracking platform owned and
                        operated by SGS Global Services Private Limited (Ad2Click Media) ("Company," "we," "us," or "our").
                        These Terms & Conditions ("Terms") form a legally binding agreement between you ("User," "Client,"
                        "Advertiser," or "Publisher") and SGS Global Services Private Limited (Ad2Click Media), governing
                        access to and use of the SGS Tracker platform, including its website, dashboard, APIs, and related services.
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold">Agreement:</p>
                        <p className="text-blue-700 text-sm mt-1">
                          By using SGS Tracker, you agree to comply with these Terms and with applicable laws and ad
                          platform policies (Google Ads, Meta, TikTok, LinkedIn, etc.).
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 2. About the Platform */}
                  <Section
                    title="About the Platform"
                    badge="Overview"
                    id="section-2"
                    isActive={activeSection === "section-2"}
                    onActivate={() => setActiveSection("section-2")}
                    icon={<Target className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        SGS Tracker is a proprietary, in-house performance marketing and analytics system developed, owned,
                        and managed by SGS Global Services Private Limited (Ad2Click Media). It is used for both internal
                        tracking of our own advertising campaigns as well as to manage and measure partner and client campaigns.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platformFeatures.map((feature, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-semibold text-gray-800 text-sm">{feature.feature}</span>
                            </div>
                            <p className="text-xs text-gray-600">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Section>

                  {/* 3. Acceptance and Eligibility */}
                  <Section
                    title="Acceptance and Eligibility"
                    badge="Requirements"
                    id="section-3"
                    isActive={activeSection === "section-3"}
                    onActivate={() => setActiveSection("section-3")}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        By accessing SGS Tracker, you confirm you are an authorized representative of a business entity
                        capable of entering into binding contracts. Access is granted only by invitation or approval from SGS
                        Global Services Private Limited (Ad2Click Media).
                      </p>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm font-semibold">Important:</p>
                        <p className="text-red-700 text-sm mt-1">
                          Unauthorized access or fraudulent activity may lead to immediate suspension or termination.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 4. Platform and Policy Compliance */}
                  <Section
                    title="Platform and Policy Compliance"
                    badge="Compliance"
                    id="section-4"
                    isActive={activeSection === "section-4"}
                    onActivate={() => setActiveSection("section-4")}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        All campaigns must comply with Google, Meta, TikTok, LinkedIn, and other platform policies, as well as
                        GDPR, India's DPDP Act (2023), and other regional data laws.
                      </p>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold">Strictly Prohibited:</p>
                        <ul className="text-yellow-700 text-sm list-disc list-inside mt-2">
                          <li>Misleading ads and cloaking</li>
                          <li>URL masking and bot traffic</li>
                          <li>Any form of policy violation</li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          The Company reserves the right to audit, suspend, or report any non-compliant usage.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 5. Data Privacy, Storage, and Retention */}
                  <Section
                    title="Data Privacy, Storage, and Retention"
                    badge="Privacy"
                    id="section-5"
                    isActive={activeSection === "section-5"}
                    onActivate={() => setActiveSection("section-5")}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Shield className="w-6 h-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-800">Data Protection</h4>
                            <p className="text-green-700 text-sm">No sensitive personal data is stored</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">60</div>
                            <div className="text-xs text-green-700">Days Retention</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">No PII</div>
                            <div className="text-xs text-green-700">Personal Data</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">GDPR</div>
                            <div className="text-xs text-green-700">Compliant</div>
                          </div>
                        </div>
                      </div>

                      <p>
                        SGS Tracker processes only campaign data (click IDs, IP, device, timestamp, geo, etc.) for attribution
                        purposes. Data is retained up to 60 days before anonymization or deletion. The platform complies with 
                        GDPR, DPDP Act 2023, and Google certification data standards.
                      </p>
                    </div>
                  </Section>

                  {/* 6. Intellectual Property Rights */}
                  <Section
                    title="Intellectual Property Rights"
                    badge="Legal"
                    id="section-6"
                    isActive={activeSection === "section-6"}
                    onActivate={() => setActiveSection("section-6")}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold">
                          All rights to the SGS Tracker software, dashboard, code, and branding belong to SGS Global Services Private Limited (Ad2Click Media).
                        </p>
                      </div>

                      <p>
                        Users are granted a limited, revocable license to access it solely for lawful tracking. 
                        Reverse engineering or reproduction is prohibited.
                      </p>
                    </div>
                  </Section>

                  {/* 7. Fees, Billing, and Taxes */}
                  <Section
                    title="Fees, Billing, and Taxes"
                    badge="Financial"
                    id="section-7"
                    isActive={activeSection === "section-7"}
                    onActivate={() => setActiveSection("section-7")}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        External usage is governed by written contracts or Insertion Orders. Fees must be paid as agreed,
                        failing which access may be suspended. Users are responsible for applicable taxes and TDS.
                      </p>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm">
                          Internal usage for SGS campaigns remains at company discretion.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 8. Prohibited Conduct */}
                  <Section
                    title="Prohibited Conduct"
                    badge="Restrictions"
                    id="section-8"
                    isActive={activeSection === "section-8"}
                    onActivate={() => setActiveSection("section-8")}
                    icon={<AlertCircle className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        You must not manipulate data, use malicious software, violate privacy frameworks, or breach ad
                        platform rules.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          "Data manipulation",
                          "Malicious software usage",
                          "Privacy framework violations",
                          "Ad platform rule breaches",
                          "Fraudulent activities",
                          "Unauthorized access"
                        ].map((prohibition, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-red-700">{prohibition}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm font-semibold">Consequences:</p>
                        <p className="text-red-700 text-sm mt-1">
                          Violations may result in account termination and legal escalation.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 9. Confidentiality */}
                  <Section
                    title="Confidentiality"
                    badge="Legal"
                    id="section-9"
                    isActive={activeSection === "section-9"}
                    onActivate={() => setActiveSection("section-9")}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold">
                          All campaign data and business information are confidential.
                        </p>
                      </div>

                      <p>
                        Disclosure or misuse is prohibited and remains binding even after termination.
                      </p>
                    </div>
                  </Section>

                  {/* 10. Indemnification */}
                  <Section
                    title="Indemnification"
                    badge="Legal"
                    id="section-10"
                    isActive={activeSection === "section-10"}
                    onActivate={() => setActiveSection("section-10")}
                    icon={<Scale className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-orange-800">
                          You agree to indemnify and hold harmless SGS Global Services Private Limited (Ad2Click Media) from
                          any claims or losses arising from misuse or policy violations.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 11. Limitation of Liability */}
                  <Section
                    title="Limitation of Liability"
                    badge="Legal"
                    id="section-11"
                    isActive={activeSection === "section-11"}
                    onActivate={() => setActiveSection("section-11")}
                    icon={<AlertCircle className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-semibold">
                          The Service is provided 'as is'.
                        </p>
                      </div>

                      <p>
                        The Company's liability shall not exceed fees paid during the last three months. 
                        The Company is not liable for indirect or consequential damages.
                      </p>
                    </div>
                  </Section>

                  {/* 12. Termination & Suspension */}
                  <Section
                    title="Termination & Suspension"
                    badge="Policy"
                    id="section-12"
                    isActive={activeSection === "section-12"}
                    onActivate={() => setActiveSection("section-12")}
                    icon={<Settings className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        The Company may suspend or terminate access for misuse, non-payment, or compliance risks.
                      </p>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm font-semibold">Immediate Effect:</p>
                        <p className="text-red-700 text-sm mt-1">
                          Upon termination, all licenses immediately cease.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 13. Modifications to Terms */}
                  <Section
                    title="Modifications to Terms"
                    badge="Updates"
                    id="section-13"
                    isActive={activeSection === "section-13"}
                    onActivate={() => setActiveSection("section-13")}
                    icon={<Settings className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        We may update these Terms periodically. Continued use constitutes acceptance of updates.
                      </p>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          Updated versions will be posted on our platform with notification to registered users.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 14. Governing Law & Jurisdiction */}
                  <Section
                    title="Governing Law & Jurisdiction"
                    badge="Legal"
                    id="section-14"
                    isActive={activeSection === "section-14"}
                    onActivate={() => setActiveSection("section-14")}
                    icon={<Building className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-purple-800 font-semibold">
                          These Terms are governed by Indian law with exclusive jurisdiction of the courts in New Delhi.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 15. Force Majeure */}
                  <Section
                    title="Force Majeure"
                    badge="Legal"
                    id="section-15"
                    isActive={activeSection === "section-15"}
                    onActivate={() => setActiveSection("section-15")}
                    icon={<Globe className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        The Company shall not be liable for delays or non-performance due to events beyond control, including
                        natural disasters or network outages.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          "Natural disasters",
                          "Network outages",
                          "Government actions",
                          "System failures",
                          "Cyber attacks",
                          "Other force majeure events"
                        ].map((event, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-sm">{event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Section>

                  {/* 16. Contact Information */}
                  <Section
                    title="Contact Information"
                    badge="Support"
                    id="section-16"
                    isActive={activeSection === "section-16"}
                    onActivate={() => setActiveSection("section-16")}
                    icon={<Mail className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Legal & Compliance Queries
                          </p>
                          <p className="text-sm text-gray-600">
                            Contact us for any questions regarding these Terms
                          </p>
                          <a
                            href="mailto:contact@ad2click.com"
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 mt-1"
                          >
                            contact@ad2click.com
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Company Information</h4>
                          <p className="text-sm text-gray-600">
                            SGS Global Services Private Limited (Ad2Click Media)
                            <br />
                            Bhutani Cyber Park, C-709 & 730, C Block, Phase 2, Industrial Area, Sector 62, Noida, Uttar Pradesh 201309, India
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Website</h4>
                          <a 
                            href="https://sgs-tracker.vercel.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            https://sgs-tracker.vercel.app
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </Section>
                </Accordion>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">
                      Secure Platform • 60-Day Data Retention • Full Compliance
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    By using SGS Tracker, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
                  </p>
                  <div className="flex justify-end mt-4">
                    <Badge variant="secondary">Last Updated: 07/10/2025</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;