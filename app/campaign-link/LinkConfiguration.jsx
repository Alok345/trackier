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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Domain URL Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="domainUrl">Domain URL</Label>
            <Select 
              value={formData.domainUrl} 
              onValueChange={(value) => onInputChange("domainUrl", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
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
            <p className="text-sm text-muted-foreground">
              Select a domain to generate tracking links
            </p>
          </div>

          {/* Source Select */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (Optional)</Label>
            <Select 
              value={formData.source} 
              onValueChange={(value) => onInputChange("source", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
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
          </div>

          {/* Advertiser Select */}
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}