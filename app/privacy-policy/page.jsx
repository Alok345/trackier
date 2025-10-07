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
    { id: "section-2", title: "Platform Overview", badge: "Services", icon: <Target className="w-4 h-4" /> },
    { id: "section-3", title: "Information We Collect", badge: "Data", icon: <Database className="w-4 h-4" /> },
    { id: "section-4", title: "Data Usage Purpose", badge: "Purpose", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "section-5", title: "Data Retention & Auto-Deletion", badge: "60 Days", icon: <Clock className="w-4 h-4" /> },
    { id: "section-6", title: "Data Sharing", badge: "Sharing", icon: <ExternalLink className="w-4 h-4" /> },
    { id: "section-7", title: "Cookies & Tracking", badge: "Tracking", icon: <Cookie className="w-4 h-4" /> },
    { id: "section-8", title: "Security Measures", badge: "Protection", icon: <Lock className="w-4 h-4" /> },
    { id: "section-9", title: "Your Rights", badge: "Rights", icon: <User className="w-4 h-4" /> },
    { id: "section-10", title: "International Data", badge: "Global", icon: <Globe className="w-4 h-4" /> },
    { id: "section-11", title: "Policy Updates", badge: "Changes", icon: <Bell className="w-4 h-4" /> },
    { id: "section-12", title: "Contact Information", badge: "Support", icon: <Mail className="w-4 h-4" /> }
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
            {/* <div className="flex justify-center items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              
            </div> */}
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Ad2Click Media Privacy Policy
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Protecting your privacy is our priority. This policy explains how we collect, use, and protect your data 
              while maintaining our commitment to automatic data deletion after 60 days.
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
                          {/* {section.badge && (
                            <Badge 
                              variant="outline" 
                              className="ml-auto text-xs"
                            >
                              {section.badge}
                            </Badge>
                          )} */}
                        </div>
                      </Button>
                    ))}
                  </TabsContent>

                  <TabsContent value="rights" className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Your Privacy Rights</h4>
                    {[
                      { right: "Access Data", description: "Request your personal information" },
                      { right: "Delete Data", description: "Remove your information immediately" },
                      { right: "Auto-Deletion", description: "Automatic deletion after 60 days" },
                      { right: "Opt-Out Marketing", description: "Stop marketing communications" },
                      { right: "Data Correction", description: "Correct inaccurate data" },
                      { right: "Export Data", description: "Download your data" }
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

                {/* Auto-Deletion Highlight */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">Auto-Delete Feature</span>
                  </div>
                  <p className="text-xs text-green-700">
                    All client data is automatically deleted after 60 days. No manual intervention required.
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
                        Ad2Click Media provides cutting-edge performance marketing solutions for modern advertisers. 
                        Our platform helps businesses measure and optimize their advertising campaigns through advanced 
                        tracking and analytics.
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold mb-2">Our Commitment:</p>
                        <p className="text-blue-700 text-sm">
                          We are committed to protecting your privacy and being transparent about our data practices. 
                          This Privacy Policy explains how we process data on our proprietary tracking platform.
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Important:</strong> By using Ad2Click Media's platform, you agree to this Privacy Policy. 
                          If you do not agree, please do not use our services.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 2. Platform Overview */}
                  <Section 
                    title="Platform Overview" 
                    badge="Services"
                    id="section-2"
                    isActive={activeSection === "section-2"}
                    onActivate={() => setActiveSection("section-2")}
                    icon={<Target className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Ad2Click Media operates as a proprietary tracking platform designed exclusively for our 
                        internal marketing operations and client campaigns.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">Core Services</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Campaign performance tracking</li>
                            <li>• Real-time analytics & reporting</li>
                            <li>• Conversion attribution</li>
                            <li>• ROI measurement</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-2">Tracking Methods</h4>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Pixel-based tracking</li>
                            <li>• Server postback tracking</li>
                            <li>• Mobile app tracking</li>
                            <li>• Cross-device measurement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 3. Information We Collect */}
                  <Section 
                    title="Information We Collect" 
                    badge="Data"
                    id="section-3"
                    isActive={activeSection === "section-3"}
                    onActivate={() => setActiveSection("section-3")}
                    icon={<Database className="w-4 h-4" />}
                  >
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Campaign Data Collected:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "IP addresses (anonymized)",
                            "Device type & operating system",
                            "Browser information",
                            "Click & conversion data",
                            "Campaign identifiers",
                            "Geographic location (country level)",
                            "Timestamp of activities",
                            "Referral URLs"
                          ].map((info, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">{info}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Client Account Information:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Business name & contact details",
                            "Email address",
                            "Billing information",
                            "Account preferences",
                            "API credentials",
                            "Campaign settings"
                          ].map((info, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">{info}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold mb-1">Note:</p>
                        <p className="text-yellow-700 text-sm">
                          We do not collect sensitive personal information like government IDs, financial account numbers, 
                          or health information. All data collection is strictly for campaign performance measurement.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 4. Data Usage Purpose */}
                  <Section 
                    title="Data Usage Purpose" 
                    badge="Purpose"
                    id="section-4"
                    isActive={activeSection === "section-4"}
                    onActivate={() => setActiveSection("section-4")}
                    icon={<BarChart3 className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p className="font-semibold text-gray-800">We use collected data exclusively for:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            purpose: "Campaign Measurement",
                            description: "Track ad performance and ROI"
                          },
                          {
                            purpose: "Analytics & Reporting",
                            description: "Generate performance insights"
                          },
                          {
                            purpose: "Fraud Prevention",
                            description: "Detect invalid traffic"
                          },
                          {
                            purpose: "Platform Optimization",
                            description: "Improve our services"
                          },
                          {
                            purpose: "Billing & Invoicing",
                            description: "Process client payments"
                          },
                          {
                            purpose: "Client Support",
                            description: "Provide account assistance"
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
                        <p className="text-red-800 text-sm font-semibold">We Do Not:</p>
                        <ul className="text-red-700 text-sm list-disc list-inside mt-2">
                          <li>Sell your data to third parties</li>
                          <li>Use data for unrelated marketing</li>
                          <li>Share data with external advertisers</li>
                          <li>Create user profiles for advertising</li>
                        </ul>
                      </div>
                    </div>
                  </Section>

                  {/* 5. Data Retention & Auto-Deletion */}
                  <Section 
                    title="Data Retention & Auto-Deletion" 
                    badge="60 Days"
                    id="section-5"
                    isActive={activeSection === "section-5"}
                    onActivate={() => setActiveSection("section-5")}
                    icon={<Clock className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Trash2 className="w-6 h-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-800">Automatic Data Deletion</h4>
                            <p className="text-green-700 text-sm">All client data automatically deleted after 60 days</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">60</div>
                            <div className="text-xs text-green-700">Days Retention</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">Auto</div>
                            <div className="text-xs text-green-700">No Manual Action</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">100%</div>
                            <div className="text-xs text-green-700">Complete Deletion</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">What Gets Deleted:</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Raw click/conversion data</li>
                            <li>• IP addresses</li>
                            <li>• Device identifiers</li>
                            <li>• User interaction logs</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg">
                          <h5 className="font-semibold text-purple-800 mb-2">What's Retained:</h5>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Aggregated reports</li>
                            <li>• Billing records (7 years)</li>
                            <li>• Account information (active clients)</li>
                            <li>• Anonymized analytics</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Note:</strong> The 60-day automatic deletion cycle ensures compliance with data 
                          protection regulations and minimizes data footprint. Clients can export their data anytime 
                          during the retention period.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 6. Data Sharing */}
                  <Section 
                    title="Data Sharing" 
                    badge="Sharing"
                    id="section-6"
                    isActive={activeSection === "section-6"}
                    onActivate={() => setActiveSection("section-6")}
                    icon={<ExternalLink className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-semibold">
                          We do not sell, rent, or trade your personal data with third parties.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Limited Sharing Scenarios:</h4>
                        <div className="space-y-3">
                          {[
                            {
                              scenario: "Service Providers",
                              description: "Trusted partners who help operate our platform (under strict confidentiality)"
                            },
                            {
                              scenario: "Legal Requirements",
                              description: "When required by law, court order, or legal process"
                            },
                            {
                              scenario: "Business Transfers",
                              description: "In case of merger, acquisition, or sale of assets"
                            },
                            {
                              scenario: "Fraud Prevention",
                              description: "To detect and prevent fraudulent activities"
                            }
                          ].map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{item.scenario}</p>
                                <p className="text-sm text-gray-600">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 7. Cookies & Tracking */}
                  <Section 
                    title="Cookies & Tracking Technologies" 
                    badge="Tracking"
                    id="section-7"
                    isActive={activeSection === "section-7"}
                    onActivate={() => setActiveSection("section-7")}
                    icon={<Cookie className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Essential Cookies</h4>
                          <p className="text-sm text-blue-700">
                            Required for platform functionality. These include session management and security cookies.
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">Analytics Cookies</h4>
                          <p className="text-sm text-green-700">
                            Help us understand how users interact with our platform and improve performance.
                          </p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold mb-2">Cookie Control:</p>
                        <p className="text-yellow-700 text-sm">
                          You can control cookies through your browser settings. However, disabling essential cookies 
                          may affect platform functionality.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Tracking Methods We Use:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Pixel Tracking", "Postback URLs", "JavaScript Tags", 
                            "API Endpoints", "Mobile SDKs", "Server-to-Server"
                          ].map((method, index) => (
                            <Badge key={index} variant="outline" className="justify-center bg-white">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 8. Security Measures */}
                  <Section 
                    title="Security Measures" 
                    badge="Protection"
                    id="section-8"
                    isActive={activeSection === "section-8"}
                    onActivate={() => setActiveSection("section-8")}
                    icon={<Lock className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            measure: "Data Encryption",
                            description: "All data encrypted in transit and at rest"
                          },
                          {
                            measure: "Access Controls",
                            description: "Role-based access and authentication"
                          },
                          {
                            measure: "Network Security",
                            description: "Firewalls and intrusion detection"
                          },
                          {
                            measure: "Regular Audits",
                            description: "Security assessments and penetration testing"
                          },
                          {
                            measure: "Secure Development",
                            description: "Security-first development practices"
                          },
                          {
                            measure: "Incident Response",
                            description: "24/7 monitoring and response team"
                          }
                        ].map((item, index) => (
                          <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="w-3 h-3 text-green-600" />
                              <span className="font-semibold text-green-800 text-sm">{item.measure}</span>
                            </div>
                            <p className="text-xs text-green-700">{item.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          <strong>Our Commitment:</strong> We implement industry-standard security measures to protect 
                          your data from unauthorized access, alteration, or destruction.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 9. Your Rights */}
                  <Section 
                    title="Your Rights" 
                    badge="Rights"
                    id="section-9"
                    isActive={activeSection === "section-9"}
                    onActivate={() => setActiveSection("section-9")}
                    icon={<User className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            right: "Access",
                            description: "Request access to your personal data"
                          },
                          {
                            right: "Correction",
                            description: "Correct inaccurate or incomplete data"
                          },
                          {
                            right: "Deletion",
                            description: "Request deletion of your data"
                          },
                          {
                            right: "Export",
                            description: "Receive your data in portable format"
                          },
                          {
                            right: "Object",
                            description: "Object to certain data processing"
                          },
                          {
                            right: "Restriction",
                            description: "Request restriction of processing"
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
                          To exercise any of these rights, please contact us at{" "}
                          <a href="mailto:contact@ad2clickmedia.com" className="underline">contact@ad2clickmedia.com</a>. 
                          We will respond to all legitimate requests within 30 days.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 10. International Data */}
                  <Section 
                    title="International Data Transfers" 
                    badge="Global"
                    id="section-10"
                    isActive={activeSection === "section-10"}
                    onActivate={() => setActiveSection("section-10")}
                    icon={<Globe className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <p>
                        Ad2Click Media operates globally, and your data may be processed in countries outside 
                        your residence. We ensure adequate protection through:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">Data Locations:</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Primary: United States</li>
                            <li>• Backup: European Union</li>
                            <li>• CDN: Global edge locations</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                          <h5 className="font-semibold text-green-800 mb-2">Protection Measures:</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Standard Contractual Clauses</li>
                            <li>• Adequacy Decisions</li>
                            <li>• Binding Corporate Rules</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          Regardless of where data is processed, we apply the same security standards and 
                          data protection measures globally.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 11. Policy Updates */}
                  <Section 
                    title="Policy Updates" 
                    badge="Changes"
                    id="section-11"
                    isActive={activeSection === "section-11"}
                    onActivate={() => setActiveSection("section-11")}
                    icon={<Bell className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                          We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                          We will notify you of any material changes by:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Bell className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Email Notification</p>
                          <p className="text-xs text-gray-600">To registered users</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Globe className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Website Notice</p>
                          <p className="text-xs text-gray-600">Updated policy posted</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Platform Alert</p>
                          <p className="text-xs text-gray-600">In-app notifications</p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          Continued use of our platform after changes constitutes acceptance of the updated policy.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* 12. Contact Information */}
                  <Section 
                    title="Contact Information" 
                    badge="Support"
                    id="section-12"
                    isActive={activeSection === "section-12"}
                    onActivate={() => setActiveSection("section-12")}
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
                            Contact our privacy team for any questions about this policy or your data
                          </p>
                          <a 
                            href="mailto:contact@ad2clickmedia.com" 
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 mt-1"
                          >
                            contact@ad2clickmedia.com
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">General Support</h4>
                          <a href="mailto:contact@ad2clickmedia.com" className="text-blue-600 hover:text-blue-800">
                            contact@ad2clickmedia.com
                          </a>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Data Protection Officer</h4>
                          <a href="mailto:contact@ad2clickmedia.com" className="text-blue-600 hover:text-blue-800">
                            contact@ad2clickmedia.com
                          </a>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm font-semibold">Response Time:</p>
                        <p className="text-green-700 text-sm">
                          We strive to respond to all privacy-related inquiries within 48 hours.
                        </p>
                      </div>
                    </div>
                  </Section>
                </Accordion>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">
                      Automatic Data Deletion: 60 Days
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    By using Ad2Click Media's platform, you acknowledge that you have read, understood, 
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