// pages/privacy-policy.jsx
"use client";
import React, { useState } from "react";
import { 
  Mail, 
  ExternalLink, 
  Shield, 
  User, 
  Globe, 
  Cookie, 
  Building, 
  Eye, 
  Trash2, 
  Bell, 
  Lock,
  Target,
  BarChart3,
  Database,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Section = ({ title, children, badge, isActive, onActivate, id, icon }) => {
  return (
    <AccordionItem value={id} className="border-b border-gray-200">
      <AccordionTrigger 
        className={`py-4 hover:no-underline group ${
          isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={onActivate}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex items-center gap-3">
            {icon}
            {badge && <Badge variant="secondary" className="mr-2">{badge}</Badge>}
            <span className={`text-lg font-semibold group-hover:text-blue-600 transition-colors ${
              isActive ? 'text-blue-700' : 'text-gray-800'
            }`}>
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

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState("section-1");
  const [activeTab, setActiveTab] = useState("all");

  const sections = [
    { id: "section-1", title: "Introduction", badge: "Overview", icon: <Shield className="w-4 h-4" /> },
    { id: "section-2", title: "Scope", badge: "Coverage", icon: <Target className="w-4 h-4" /> },
    { id: "section-3", title: "Data We Collect", badge: "Data", icon: <Database className="w-4 h-4" /> },
    { id: "section-4", title: "No Personal Data Collection", badge: "Privacy", icon: <Eye className="w-4 h-4" /> },
    { id: "section-5", title: "Legal Basis for Processing", badge: "Legal", icon: <Building className="w-4 h-4" /> },
    { id: "section-6", title: "Purpose of Processing", badge: "Purpose", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "section-7", title: "Data Sharing and Disclosure", badge: "Sharing", icon: <ExternalLink className="w-4 h-4" /> },
    { id: "section-8", title: "International Transfers", badge: "Global", icon: <Globe className="w-4 h-4" /> },
    { id: "section-9", title: "Data Retention & Deletion", badge: "60 Days", icon: <Clock className="w-4 h-4" /> },
    { id: "section-10", title: "Your Rights", badge: "Rights", icon: <User className="w-4 h-4" /> },
    { id: "section-11", title: "Data Concerning Children", badge: "Children", icon: <Shield className="w-4 h-4" /> },
    { id: "section-12", title: "Policy Updates", badge: "Changes", icon: <Bell className="w-4 h-4" /> },
    { id: "section-13", title: "Contact Information", badge: "Support", icon: <Mail className="w-4 h-4" /> }
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              SGS Tracker Privacy Policy
            </CardTitle>
            <p className="text-sm text-gray-600 max-w-3xl mx-auto">
              This Privacy Policy explains how SGS Global Services Private Limited (Ad2Click Media) collects, uses, 
              and safeguards data through its proprietary performance marketing platform, SGS Tracker.
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">Policy Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="all">All Sections</TabsTrigger>
                    <TabsTrigger value="rights">Your Rights</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-1">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        className={`w-full justify-start text-sm font-normal ${
                          activeSection === section.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
                        }`}
                        onClick={() => handleSectionClick(section.id)}
                      >
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span className="text-left">{section.title}</span>
                        </div>
                      </Button>
                    ))}
                  </TabsContent>

                  <TabsContent value="rights" className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Your Privacy Rights</h4>
                    {[
                      { right: "Access Data", description: "Request access to your information" },
                      { right: "Delete Data", description: "Request deletion of your data" },
                      { right: "Correction", description: "Correct inaccurate data" },
                      { right: "Restriction", description: "Restrict processing of your data" },
                      { right: "Object", description: "Object to data processing" },
                      { right: "Portability", description: "Receive your data in portable format" }
                    ].map((item, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-semibold text-gray-800 text-sm">{item.right}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                {/* Key Feature Highlight */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">Anonymous Data Only</span>
                  </div>
                  <p className="text-xs text-green-700">
                    SGS Tracker collects only non-personal, anonymized information. No personally identifiable information is stored.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <Accordion type="single" collapsible value={activeSection} onValueChange={setActiveSection}>
                  {/* 1. Introduction */}
                  <Section 
                    title="Introduction" 
                    badge="Overview"
                    id="section-1"
                    isActive={activeSection === "section-1"}
                    onActivate={() => setActiveSection("section-1")}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        This Privacy Policy explains how SGS Global Services Private Limited (Ad2Click Media)
                        ("Company," "we," "us," or "our") collects, uses, and safeguards data through its proprietary performance
                        marketing platform, SGS Tracker. SGS Tracker is an in-house campaign tracking system used for both
                        our own campaigns and those managed for verified clients and partners. All data processed is
                        anonymous and non-personal, used solely for legitimate business and compliance purposes.
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold mb-2">Our Commitment:</p>
                        <p className="text-blue-700 text-sm">
                          We are committed to protecting privacy through anonymous data processing and transparent 
                          data practices. No personal data is collected or stored.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 2. Scope */}
                  <Section 
                    title="Scope" 
                    badge="Coverage"
                    id="section-2"
                    isActive={activeSection === "section-2"}
                    onActivate={() => setActiveSection("section-2")}
                    icon={<Target className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        This Policy applies to tracking, analytics, and attribution conducted via SGS Tracker. It covers tracking
                        links, APIs, postbacks, and integrations for both internal and client campaigns.
                      </p>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold">Important Note:</p>
                        <p className="text-yellow-700 text-sm mt-1">
                          This policy does not apply to third-party data collection by networks such as Google Ads, 
                          Meta Ads, TikTok, or LinkedIn. Please refer to those platforms' respective privacy policies.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 3. Data We Collect */}
                  <Section 
                    title="Data We Collect" 
                    badge="Data"
                    id="section-3"
                    isActive={activeSection === "section-3"}
                    onActivate={() => setActiveSection("section-3")}
                    icon={<Database className="w-4 h-4" />}
                  >
                    <div className="space-y-6">
                      <p>
                        SGS Tracker collects only non-personal, anonymized information required for attribution and
                        analytics. We do not collect or store personally identifiable information (PII).
                      </p>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Technical & Campaign Data:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Click IDs",
                            "Conversion IDs", 
                            "IP (truncated)",
                            "Device type",
                            "Browser information",
                            "Operating System",
                            "Campaign ID",
                            "Timestamp"
                          ].map((info, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">{info}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Account & Access Data:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Business name",
                            "Email address",
                            "Encrypted credentials"
                          ].map((info, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">{info}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm font-semibold mb-1">Cookies & SDKs:</p>
                        <p className="text-green-700 text-sm">
                          Essential first-party cookies used solely for attribution; no third-party tracking cookies.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 4. No Personal Data Collection */}
                  <Section 
                    title="No Personal Data Collection" 
                    badge="Privacy"
                    id="section-4"
                    isActive={activeSection === "section-4"}
                    onActivate={() => setActiveSection("section-4")}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-semibold">
                          SGS Tracker does not track individual users. All data points (clicks, conversions, device info) are
                          anonymous and aggregated.
                        </p>
                      </div>

                      <p>
                        We do not collect, infer, or link any personal identity. The platform
                        complies with Google Ads Data Protection Terms, Meta Advertising Policies, GDPR, and DPDP
                        principles.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">We Do Not Collect:</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Names or contact information</li>
                            <li>• Personal identifiers</li>
                            <li>• Location data (precise)</li>
                            <li>• Sensitive information</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg">
                          <h5 className="font-semibold text-purple-800 mb-2">Compliance:</h5>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• GDPR compliant</li>
                            <li>• DPDP principles</li>
                            <li>• Platform policy compliant</li>
                            <li>• Industry standards</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 5. Legal Basis for Processing */}
                  <Section 
                    title="Legal Basis for Processing" 
                    badge="Legal"
                    id="section-5"
                    isActive={activeSection === "section-5"}
                    onActivate={() => setActiveSection("section-5")}
                    icon={<Building className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Data is processed under legitimate interest (fraud prevention and optimization), 
                        contractual necessity (advertiser or affiliate operations), and legal compliance.
                      </p>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold">
                          No personal consent is required as SGS Tracker does not handle personal data.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-blue-600">1</div>
                          <div className="text-xs text-blue-700">Legitimate Interest</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-green-600">2</div>
                          <div className="text-xs text-green-700">Contractual Necessity</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-purple-600">3</div>
                          <div className="text-xs text-purple-700">Legal Compliance</div>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 6. Purpose of Processing */}
                  <Section 
                    title="Purpose of Processing" 
                    badge="Purpose"
                    id="section-6"
                    isActive={activeSection === "section-6"}
                    onActivate={() => setActiveSection("section-6")}
                    icon={<BarChart3 className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p className="font-semibold text-gray-800">Data is used only for:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            purpose: "Campaign Performance",
                            description: "Measurement and analytics"
                          },
                          {
                            purpose: "Fraud Detection",
                            description: "Prevention and detection"
                          },
                          {
                            purpose: "Platform Optimization",
                            description: "Service improvement"
                          },
                          {
                            purpose: "Legal Compliance",
                            description: "Billing and regulatory"
                          }
                        ].map((item, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-semibold text-gray-800 text-sm">{item.purpose}</span>
                            </div>
                            <p className="text-xs text-gray-600">{item.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm font-semibold">We Never:</p>
                        <ul className="text-red-700 text-sm list-disc list-inside mt-2">
                          <li>Sell data to third parties</li>
                          <li>Use data for behavioral targeting</li>
                          <li>Create user profiles</li>
                          <li>Use data for unrelated marketing</li>
                        </ul>
                      </div>
                    </div>
                  </Section>

                  {/* 7. Data Sharing and Disclosure */}
                  <Section 
                    title="Data Sharing and Disclosure" 
                    badge="Sharing"
                    id="section-7"
                    isActive={activeSection === "section-7"}
                    onActivate={() => setActiveSection("section-7")}
                    icon={<ExternalLink className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-semibold">
                          All shared data is non-personal, aggregated, or anonymized, used strictly for attribution, 
                          analytics, or compliance. We do not share or sell any personally identifiable data.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Trusted Parties We May Share With:</h4>
                        <div className="space-y-3">
                          {[
                            {
                              party: "Advertisers",
                              description: "To verify conversions and leads"
                            },
                            {
                              party: "Publishers / Affiliates",
                              description: "To attribute valid traffic for payout and reconciliation"
                            },
                            {
                              party: "Clients / Agencies",
                              description: "For reporting and performance insights"
                            },
                            {
                              party: "Ad Platforms",
                              description: "e.g., Google Ads, Meta, TikTok, for conversion validation"
                            },
                            {
                              party: "Technology Vendors",
                              description: "e.g., Vercel, AWS, Render, for secure hosting"
                            },
                            {
                              party: "Regulatory Authorities",
                              description: "When disclosure is required by law"
                            }
                          ].map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{item.party}</p>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          All recipients operate under confidentiality and data protection agreements.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 8. International Transfers */}
                  <Section 
                    title="International Transfers" 
                    badge="Global"
                    id="section-8"
                    isActive={activeSection === "section-8"}
                    onActivate={() => setActiveSection("section-8")}
                    icon={<Globe className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Data may be processed across jurisdictions (India, EU, UAE, US) under encryption 
                        and Standard Contractual Clauses. All cross-border transfers follow strict data 
                        protection safeguards.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">Processing Locations:</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• India</li>
                            <li>• European Union</li>
                            <li>• United Arab Emirates</li>
                            <li>• United States</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                          <h5 className="font-semibold text-green-800 mb-2">Protection Measures:</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Encryption in transit and at rest</li>
                            <li>• Standard Contractual Clauses</li>
                            <li>• Data protection safeguards</li>
                            <li>• Compliance with local laws</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 9. Data Retention & Deletion */}
                  <Section 
                    title="Data Retention & Deletion" 
                    badge="60 Days"
                    id="section-9"
                    isActive={activeSection === "section-9"}
                    onActivate={() => setActiveSection("section-9")}
                    icon={<Clock className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Trash2 className="w-6 h-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-800">Automatic Data Deletion</h4>
                            <p className="text-green-700 text-sm">Anonymous event data retained for up to 60 days</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">60</div>
                            <div className="text-xs text-green-700">Days Retention</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">90</div>
                            <div className="text-xs text-green-700">Backup Purge</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">Auto</div>
                            <div className="text-xs text-green-700">Permanent Deletion</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">Retention Periods:</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Anonymous event data: 60 days</li>
                            <li>• Backups: 90 days</li>
                            <li>• Account data: While active</li>
                            <li>• Billing data: Compliance period</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg">
                          <h5 className="font-semibold text-purple-800 mb-2">Deletion Requests:</h5>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Email: contact@ad2click.com</li>
                            <li>• Processed promptly</li>
                            <li>• Confirmation provided</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 10. Your Rights */}
                  <Section 
                    title="Your Rights" 
                    badge="Rights"
                    id="section-10"
                    isActive={activeSection === "section-10"}
                    onActivate={() => setActiveSection("section-10")}
                    icon={<User className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Depending on your jurisdiction, you may request data access, correction, deletion, 
                        or restriction of processing.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            right: "Access",
                            description: "Request access to your information"
                          },
                          {
                            right: "Correction",
                            description: "Correct inaccurate data"
                          },
                          {
                            right: "Deletion",
                            description: "Request deletion of your data"
                          },
                          {
                            right: "Restriction",
                            description: "Restrict processing of data"
                          },
                          {
                            right: "Portability",
                            description: "Receive data in portable format"
                          },
                          {
                            right: "Object",
                            description: "Object to data processing"
                          }
                        ].map((item, index) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="font-semibold text-purple-800 text-sm">{item.right}</span>
                            </div>
                            <p className="text-xs text-purple-700">{item.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm font-semibold">Exercising Your Rights:</p>
                        <p className="text-green-700 text-sm mt-1">
                          Contact us at{" "}
                          <a href="mailto:contact@ad2click.com" className="underline">contact@ad2click.com</a>{" "}
                          to exercise these rights.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 11. Data Concerning Children */}
                  <Section 
                    title="Data Concerning Children" 
                    badge="Children"
                    id="section-11"
                    isActive={activeSection === "section-11"}
                    onActivate={() => setActiveSection("section-11")}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold">
                          SGS Tracker is intended for corporate use only.
                        </p>
                      </div>

                      <p>
                        We do not knowingly collect or process data from individuals under 18 years of age. 
                        Our platform and services are designed exclusively for business-to-business use cases.
                      </p>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          If you believe we have inadvertently collected information from someone under 18, 
                          please contact us immediately at contact@ad2click.com.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 12. Policy Updates */}
                  <Section 
                    title="Policy Updates" 
                    badge="Changes"
                    id="section-12"
                    isActive={activeSection === "section-12"}
                    onActivate={() => setActiveSection("section-12")}
                    icon={<Bell className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                          This Policy may be updated periodically. Updated versions will be posted on our 
                          website with a new "Last Updated" date.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Bell className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Email Notification</p>
                          <p className="text-xs text-gray-600">For major updates</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Globe className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Website Update</p>
                          <p className="text-xs text-gray-600">Policy posted online</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Dashboard Notice</p>
                          <p className="text-xs text-gray-600">Platform notifications</p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          Continued use of our services after updates constitutes acceptance of the revised policy.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 13. Contact Information */}
                  <Section 
                    title="Contact Information" 
                    badge="Support"
                    id="section-13"
                    isActive={activeSection === "section-13"}
                    onActivate={() => setActiveSection("section-13")}
                    icon={<Mail className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Privacy Questions?</p>
                          <p className="text-sm text-gray-600">
                            Contact our privacy team for any questions about this policy
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

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm">
                          <strong>Governing Law:</strong> This Policy is governed by the laws of India and subject 
                          to the exclusive jurisdiction of the courts in New Delhi.
                        </p>
                      </div>
                    </div>
                  </Section>
                </Accordion>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">
                      Anonymous Data Processing • 60-Day Auto Deletion • No PII Collection
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    By using SGS Tracker, you acknowledge that you have read, understood, 
                    and agree to be bound by this Privacy Policy.
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

export default PrivacyPolicy;