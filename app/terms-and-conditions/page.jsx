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

const Section = ({ title, children, badge, isActive, onActivate, id }) => {
  return (
    <AccordionItem value={id} className="border-b border-gray-200">
      <AccordionTrigger
        className={`py-4 hover:no-underline group ${
          isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
        }`}
        onClick={onActivate}
      >
        <div className="flex items-center gap-3 text-left">
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
      title: "Scope of Services",
      badge: "Core",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "section-2",
      title: "Client Responsibilities",
      badge: "Important",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "section-3",
      title: "Publisher Responsibilities",
      badge: "Important",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "section-4",
      title: "Account Registration",
      badge: "Required",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "section-5",
      title: "Fees & Payment",
      badge: "Financial",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: "section-6",
      title: "Data & Privacy",
      badge: "GDPR",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "section-7",
      title: "Intellectual Property",
      badge: "Legal",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "section-8",
      title: "Confidentiality",
      badge: "Legal",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "section-9",
      title: "Acceptable Use",
      badge: "Policy",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "section-10",
      title: "Termination",
      badge: "Policy",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "section-11",
      title: "Liability",
      badge: "Legal",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "section-12",
      title: "Dispute Resolution",
      badge: "Legal",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "section-13",
      title: "Campaign Examples",
      badge: "Examples",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "section-14",
      title: "Modifications",
      badge: "Update",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "section-15",
      title: "Force Majeure",
      badge: "Legal",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "section-16",
      title: "Contact Information",
      badge: "Support",
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  const campaignTypes = [
    {
      type: "CPI",
      description: "Cost Per Install",
      color: "bg-blue-100 text-blue-800",
    },
    {
      type: "CPA",
      description: "Cost Per Action",
      color: "bg-green-100 text-green-800",
    },
    {
      type: "CPC",
      description: "Cost Per Click",
      color: "bg-purple-100 text-purple-800",
    },
    {
      type: "CPM",
      description: "Cost Per Mille",
      color: "bg-orange-100 text-orange-800",
    },
    {
      type: "CPS",
      description: "Cost Per Sale",
      color: "bg-red-100 text-red-800",
    },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    // Scroll to the section smoothly
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
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm relative overflow-visible">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Ad2Click Media Terms & Conditions
            </CardTitle>
            <p className="text-sm text-gray-600 max-w-3xl mx-auto">
              Welcome to Ad2Click Media! By accessing or using our platform, you
              agree to comply with these comprehensive Terms & Conditions that
              govern your advertising journey.
            </p>
          </CardHeader>

          {/* Last Updated Badge */}
          {/* <Badge
            variant="outline"
            className="absolute bottom-2 md:bottom-4 right-4 px-3 py-1 text-sm"
          >
            Last Updated: 07/10/2025
          </Badge> */}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="all">All Sections</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
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
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span>{section.title}</span>
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

                  <TabsContent value="campaigns" className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Campaign Types
                    </h4>
                    {campaignTypes.map((campaign) => (
                      <div
                        key={campaign.type}
                        className="p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">
                            {campaign.type}
                          </span>
                          <Badge className={campaign.color}>
                            {campaign.description}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
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
                  {/* 1. Scope of Services */}
                  <Section
                    title="Scope of Services"
                    badge="Core"
                    id="section-1"
                    isActive={activeSection === "section-1"}
                    onActivate={() => setActiveSection("section-1")}
                  >
                    <p className="mb-4">
                      Ad2Click Media provides a comprehensive full-stack
                      marketing platform designed for modern advertisers and
                      publishers. Our services include:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {[
                        "Campaign tracking for CPI, CPA, CPC, CPM, and CPS models",
                        "Real-time analytics dashboards with detailed reporting",
                        "Creative management and ad distribution across platforms",
                        "Audience targeting, filtering, and optimization",
                        "Automated data deletion after 60 days for privacy",
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-semibold mb-1">Example:</p>
                      <p className="text-sm text-green-700">
                        For a CPA campaign, a client pays only when a user completes a defined action, 
                        such as installing an app or making a purchase.
                      </p>
                    </div> */}
                  </Section>

                  {/* 2. Client Responsibilities */}
                  <Section
                    title="Client Responsibilities"
                    badge="Important"
                    id="section-2"
                    isActive={activeSection === "section-2"}
                    onActivate={() => setActiveSection("section-2")}
                  >
                    <div className="space-y-3">
                      {[
                        "Ensure all campaign content complies with applicable laws and regulations",
                        "Guarantee ownership or licensed rights for all creative materials",
                        "Avoid fraudulent activities like fake clicks, installs, or conversions",
                        "Provide accurate and timely campaign details and objectives",
                      ].map((responsibility, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2"
                        >
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-sm font-bold">
                              !
                            </span>
                          </div>
                          <span>{responsibility}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* 3. Publisher Responsibilities */}
                  <Section
                    title="Publisher Responsibilities"
                    badge="Important"
                    id="section-3"
                    isActive={activeSection === "section-3"}
                    onActivate={() => setActiveSection("section-3")}
                  >
                    <p className="mb-3">
                      Publishers using our platform to monetize traffic must
                      adhere to the following guidelines:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>
                        Only use approved creatives and comply with
                        campaign-specific terms
                      </li>
                      <li>
                        Not engage in fraudulent traffic generation methods or
                        incentivized clicks
                      </li>
                      <li>
                        Ensure ad placements comply with local regulations and
                        platform policies
                      </li>
                      <li>
                        Maintain transparency in traffic sources and user
                        acquisition methods
                      </li>
                    </ul>
                  </Section>

                  {/* 4. Account Registration */}
                  <Section
                    title="Account Registration"
                    badge="Required"
                    id="section-4"
                    isActive={activeSection === "section-4"}
                    onActivate={() => setActiveSection("section-4")}
                  >
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        Users must register with accurate personal and business
                        information.
                        <strong>
                          {" "}
                          Sharing accounts or providing false details may result
                          in immediate termination
                        </strong>
                        and potential legal action.
                      </p>
                    </div>
                  </Section>

                  {/* 5. Fees, Payment, and Taxes */}
                  <Section
                    title="Fees, Payment, and Taxes"
                    badge="Financial"
                    id="section-5"
                    isActive={activeSection === "section-5"}
                    onActivate={() => setActiveSection("section-5")}
                  >
                    <p>
                      Clients agree to pay all applicable fees as specified in
                      invoices or agreements. All taxes, including VAT, GST, and
                      transaction fees, are the responsibility of the client.
                    </p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Note:</strong> Payment terms are typically net
                        30 days from invoice date. Late payments may incur
                        additional fees as specified in your service agreement.
                      </p>
                    </div>
                  </Section>

                  {/* 6. Data Collection and Privacy */}
                  <Section
                    title="Data Collection and Privacy"
                    badge="GDPR"
                    id="section-6"
                    isActive={activeSection === "section-6"}
                    onActivate={() => setActiveSection("section-6")}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold">Secure Data Storage</p>
                          <p className="text-sm text-gray-600">
                            All client and end-user data is encrypted and
                            securely stored
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">🔄</span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            Automatic Data Deletion
                          </p>
                          <p className="text-sm text-gray-600">
                            Data older than 60 days is automatically deleted
                            from our systems
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">⚖️</span>
                        </div>
                        <div>
                          <p className="font-semibold">Legal Compliance</p>
                          <p className="text-sm text-gray-600">
                            Clients must comply with GDPR, CCPA, and other
                            relevant data protection laws
                          </p>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* 7. Intellectual Property */}
                  <Section
                    title="Intellectual Property"
                    badge="Legal"
                    id="section-7"
                    isActive={activeSection === "section-7"}
                    onActivate={() => setActiveSection("section-7")}
                  >
                    <p>
                      All intellectual property related to Ad2Click Media's
                      platform, including software, trademarks, and proprietary
                      technology, belongs to Ad2Click Media. Clients retain
                      rights to their campaign materials but grant the platform
                      a limited license for delivery and reporting purposes.
                    </p>
                  </Section>

                  {/* 8. Confidentiality */}
                  <Section
                    title="Confidentiality"
                    badge="Legal"
                    id="section-8"
                    isActive={activeSection === "section-8"}
                    onActivate={() => setActiveSection("section-8")}
                  >
                    <p>
                      Both parties agree to maintain the confidentiality of all
                      proprietary information, including business strategies,
                      technical data, and customer information. Disclosure is
                      allowed only to authorized personnel on a strict
                      need-to-know basis.
                    </p>
                  </Section>

                  {/* 9. Acceptable Use */}
                  <Section
                    title="Acceptable Use"
                    badge="Policy"
                    id="section-9"
                    isActive={activeSection === "section-9"}
                    onActivate={() => setActiveSection("section-9")}
                  >
                    <p className="mb-3">
                      Users must not engage in any activity that harms the
                      platform, other users, or violates laws. Prohibited
                      activities include:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "Malware distribution",
                        "Unauthorized data collection",
                        "Click fraud or analytics manipulation",
                        "Spam or phishing activities",
                        "Network attacks or exploitation",
                        "Copyright infringement",
                      ].map((activity, index) => (
                        <Badge
                          key={index}
                          variant="destructive"
                          className="justify-center"
                        >
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </Section>

                  {/* 10. Termination */}
                  <Section
                    title="Termination"
                    badge="Policy"
                    id="section-10"
                    isActive={activeSection === "section-10"}
                    onActivate={() => setActiveSection("section-10")}
                  >
                    <p>
                      Either party may terminate access with 30 days written
                      notice. Upon termination, all licenses are revoked,
                      platform access is disabled, and client data older than 60
                      days is automatically deleted from our systems.
                    </p>
                  </Section>

                  {/* 11. Limitation of Liability */}
                  <Section
                    title="Limitation of Liability"
                    badge="Legal"
                    id="section-11"
                    isActive={activeSection === "section-11"}
                    onActivate={() => setActiveSection("section-11")}
                  >
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800">
                        Ad2Click Media is not liable for indirect, incidental,
                        or consequential damages. Maximum liability is limited
                        to fees paid by the client in the past 12 months.
                      </p>
                    </div>
                  </Section>

                  {/* 12. Dispute Resolution */}
                  <Section
                    title="Dispute Resolution"
                    badge="Legal"
                    id="section-12"
                    isActive={activeSection === "section-12"}
                    onActivate={() => setActiveSection("section-12")}
                  >
                    <p>
                      Any disputes shall be resolved under Indian law, with
                      competent courts in Jaipur, Rajasthan, India having
                      exclusive jurisdiction.
                    </p>
                  </Section>

                  {/* 13. Campaign Examples */}
                  <Section
                    title="Campaign Examples"
                    badge="Examples"
                    id="section-13"
                    isActive={activeSection === "section-13"}
                    onActivate={() => setActiveSection("section-13")}
                  >
                    <div className="space-y-4">
                      {[
                        {
                          type: "CPI",
                          name: "Cost Per Install",
                          description:
                            "Client pays when a user installs the app",
                          example: "Mobile game installation campaigns",
                        },
                        {
                          type: "CPA",
                          name: "Cost Per Action",
                          description:
                            "Client pays when a user completes a specific action",
                          example:
                            "Registrations, purchases, or form submissions",
                        },
                        {
                          type: "CPM",
                          name: "Cost Per Mille",
                          description: "Client pays per 1000 impressions",
                          example: "Brand awareness campaigns",
                        },
                      ].map((campaign, index) => (
                        <Card
                          key={index}
                          className="border-l-4 border-l-blue-500"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                {campaign.type}
                              </Badge>
                              <span className="font-semibold text-gray-800">
                                {campaign.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {campaign.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              Example: {campaign.example}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </Section>

                  {/* 14. Modifications */}
                  <Section
                    title="Modifications to Terms"
                    badge="Update"
                    id="section-14"
                    isActive={activeSection === "section-14"}
                    onActivate={() => setActiveSection("section-14")}
                  >
                    <p>
                      Ad2Click Media may update these Terms & Conditions
                      periodically to reflect changes in our services or legal
                      requirements. Continued use of the platform constitutes
                      acceptance of any changes.
                    </p>
                  </Section>

                  {/* 15. Force Majeure */}
                  <Section
                    title="Calamity"
                    badge="Legal"
                    id="section-15"
                    isActive={activeSection === "section-15"}
                    onActivate={() => setActiveSection("section-15")}
                  >
                    <p>
                      Ad2Click Media shall not be liable for failures or delays
                      caused by events beyond its reasonable control, including
                      natural disasters, war, terrorism, system outages, or
                      government restrictions.
                    </p>
                  </Section>

                  {/* 16. Contact Information */}
                  <Section
                    title="Contact Information"
                    badge="Support"
                    id="section-16"
                    isActive={activeSection === "section-16"}
                    onActivate={() => setActiveSection("section-16")}
                  >
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          Need Help?
                        </p>
                        <p className="text-sm text-gray-600">
                          Contact our support team for any questions regarding
                          these Terms
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
                  </Section>
                </Accordion>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    By using Ad2Click Media's platform, you acknowledge that you
                    have read, understood, and agree to be bound by these Terms
                    & Conditions.
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Badge variant="secondary">Last Updated: 07/10/2025</Badge>
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
