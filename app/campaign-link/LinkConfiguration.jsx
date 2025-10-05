import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LinkConfiguration({ 
  formData, 
  domains, 
  sources, 
  advertisers, 
  onInputChange, 
  onAddDomain, 
  onAddSource 
}) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Link Configuration</CardTitle>
        <div className="flex gap-2">
          <Button onClick={onAddDomain}>Add Domain</Button>
          <Button onClick={onAddSource}>Add Source</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields Warning */}
        {(!formData.domainUrl || !formData.source) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center text-yellow-800 text-sm">
              <span className="font-medium">⚠️ Required Fields Missing:</span>
              <span className="ml-2">
                {!formData.domainUrl && "Domain URL, "}
                {!formData.source && "Source"}
                {!formData.domainUrl && !formData.source && " must be selected to generate links"}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Domain URL Dropdown - REQUIRED */}
          <div className="space-y-2">
            <Label htmlFor="domainUrl" className="flex items-center gap-1">
              Domain URL
              <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.domainUrl} 
              onValueChange={(value) => onInputChange("domainUrl", value)}
            >
              <SelectTrigger className={!formData.domainUrl ? 'border-red-300 bg-red-50' : ''}>
                <SelectValue placeholder="Select domain *" />
              </SelectTrigger>
              <SelectContent>
                {domains.length === 0 ? (
                  <SelectItem value="no-domains" disabled>
                    No domains available
                  </SelectItem>
                ) : (
                  domains.map((domain, index) => (
                    <SelectItem key={index} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!formData.domainUrl ? (
              <p className="text-sm text-red-500">
                Domain URL is required
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selected domain for tracking links
              </p>
            )}
          </div>

          {/* Source Select - REQUIRED */}
          <div className="space-y-2">
            <Label htmlFor="source" className="flex items-center gap-1">
              Source
              <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.source} 
              onValueChange={(value) => onInputChange("source", value)}
            >
              <SelectTrigger className={!formData.source ? 'border-red-300 bg-red-50' : ''}>
                <SelectValue placeholder="Select source *" />
              </SelectTrigger>
              <SelectContent>
                {sources.length === 0 ? (
                  <SelectItem value="no-sources" disabled>
                    No sources available
                  </SelectItem>
                ) : (
                  sources.map((source, index) => (
                    <SelectItem key={index} value={source.name}>
                      {source.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!formData.source ? (
              <p className="text-sm text-red-500">
                Source is required
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Traffic source identifier
              </p>
            )}
          </div>

          {/* Advertiser Select - OPTIONAL */}
          <div className="space-y-2">
            <Label htmlFor="advertiserId">Advertiser (Optional)</Label>
            <Select 
              value={formData.advertiserId} 
              onValueChange={(value) => onInputChange("advertiserId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select advertiser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advertisers</SelectItem>
                {advertisers.map((advertiser) => (
                  <SelectItem key={advertiser.id} value={advertiser.advertiserId}>
                    {advertiser.name} ({advertiser.advertiserId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Filter by specific advertiser
            </p>
          </div>
        </div>

        {/* Configuration Status */}
        {/* <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Configuration Status:</span>
            <span className={`ml-2 ${formData.domainUrl && formData.source ? 'text-green-600' : 'text-red-600'}`}>
              {formData.domainUrl && formData.source 
                ? '✅ Ready to generate links' 
                : '❌ Select Domain URL and Source to enable link generation'
              }
            </span>
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
}